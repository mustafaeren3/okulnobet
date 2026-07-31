-- ═══════════════════════════════════════════════════════════════
-- FEATURE GATING — zaman bazlı deneme yerine özellik bazlı kısıt
-- ═══════════════════════════════════════════════════════════════
-- Ürün kararı: artık "14 gün sonra kapan" bir deneme yok. Ücretsiz plan
-- KALICI ama kısıtlı: okul programı toplam 1 kez tam üretebilir (bkz.
-- trial_schedule_generated_at), ürettiği programın sadece ilk ayını
-- görüntüleyebilir (ay kilidi, lib/engine/access.js'te saf fonksiyon
-- olarak hesaplanır — bu migration'da ay bilgisi için ayrı bir sütun
-- YOK, ay aralığı zaten duty_assignments.duty_date'ten türetiliyor).
--
-- trial_ends_at / checkTrialDateRangeAllowed artık kullanılmıyor (bkz.
-- lib/engine/subscription.js) ama sütun geriye dönük uyumluluk için
-- silinmiyor — sadece okunmuyor.

alter table public.subscriptions add column if not exists trial_schedule_generated_at timestamptz;

-- ── mark_trial_schedule_generated(): ücretsiz okulun "1 kez tam üretim
-- hakkını" kullandığını işaretler. authenticated'e subscriptions üzerinde
-- hâlâ UPDATE grant'i yok (0010'daki kasıtlı karar korunuyor) — bu dar
-- kapsamlı SECURITY DEFINER fonksiyon tek istisna, sadece ÇAĞIRANIN
-- KENDİ okulunu ve sadece bu tek sütunu değiştirebilir, zaten doluysa
-- dokunmaz (idempotent).
create or replace function public.mark_trial_schedule_generated()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update subscriptions
  set trial_schedule_generated_at = now()
  where school_id = current_school_id()
    and trial_schedule_generated_at is null;
end;
$$;
grant execute on function public.mark_trial_schedule_generated() to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- SCHEDULE_GENERATIONS — her "Program Oluştur" (dryRun=false) çağrısının
-- olay kaydı. Faz 9'da başarı ekranı + Faz 10'daki platform/okul
-- analytics'in (oluşturulan program sayısı, ort. oluşturma süresi,
-- tahmini kazanılan zaman) TEK veri kaynağı — ayrı bir sayaç/aggregate
-- sütunu tutulmuyor, ihtiyaç oldukça bu tablodan canlı hesaplanıyor
-- (pricing.js/platformMetrics.js'teki "saklama, canlı hesapla" ilkesiyle
-- aynı).
create table if not exists public.schedule_generations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  duration_ms int not null default 0,
  created_count int not null default 0,
  teacher_count int not null default 0,
  zone_count int not null default 0,
  conflict_count int not null default 0,
  fairness_score int not null default 0
);

alter table public.schedule_generations enable row level security;

drop policy if exists "schedule_generations_select_own_school" on public.schedule_generations;
create policy "schedule_generations_select_own_school" on public.schedule_generations
  for select using (school_id = public.current_school_id());

-- Yazma izni authenticated'e açılmıyor — sadece log_schedule_generation
-- (SECURITY DEFINER) satır ekler, bkz. lib/db/bulkSchedule.js.
grant select on public.schedule_generations to authenticated;

create or replace function public.log_schedule_generation(
  p_duration_ms int,
  p_created_count int,
  p_teacher_count int,
  p_zone_count int,
  p_conflict_count int,
  p_fairness_score int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into schedule_generations
    (school_id, duration_ms, created_count, teacher_count, zone_count, conflict_count, fairness_score)
  values
    (current_school_id(), p_duration_ms, p_created_count, p_teacher_count, p_zone_count, p_conflict_count, p_fairness_score);
end;
$$;
grant execute on function public.log_schedule_generation(int, int, int, int, int, int) to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- SCHEDULE_SHARES — "Programı paylaşma" (premium özellik). Okul başına
-- TEK aktif bağlantı (yeni link oluşturunca eskisi silinir — v1'de
-- birden çok bağlantı yönetimi yok, YAGNI). Herkese açık okuma SADECE
-- dar bir SECURITY DEFINER fonksiyon (get_public_schedule) üzerinden —
-- ne duty_assignments ne de schedule_shares'e anon için doğrudan RLS
-- select açılıyor (0016'daki süper admin desenin aynısı: geniş bypass
-- yerine dar RPC).
create table if not exists public.schedule_shares (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  token text not null unique,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

alter table public.schedule_shares enable row level security;

drop policy if exists "schedule_shares_select_own_school" on public.schedule_shares;
create policy "schedule_shares_select_own_school" on public.schedule_shares
  for select using (school_id = public.current_school_id());

drop policy if exists "schedule_shares_delete_own_school" on public.schedule_shares;
create policy "schedule_shares_delete_own_school" on public.schedule_shares
  for delete using (school_id = public.current_school_id());

grant select, delete on public.schedule_shares to authenticated;

-- create_schedule_share(): premium olmayan okul çağırırsa reddeder
-- (UI'daki gating'in DB seviyesindeki tekrarı — savunma amaçlı, UI
-- kontrolü atlatılırsa bile burada engellenir). Token, pgcrypto'ya
-- bağımlı olmadan iki gen_random_uuid()'in birleşimiyle üretilir.
create or replace function public.create_schedule_share(p_start_date date, p_end_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
  v_is_premium boolean;
  v_token text;
begin
  v_school_id := current_school_id();
  select (status = 'active') into v_is_premium from subscriptions where school_id = v_school_id;
  if not coalesce(v_is_premium, false) then
    raise exception 'Paylaşım özelliği Premium''e özel.';
  end if;

  delete from schedule_shares where school_id = v_school_id;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into schedule_shares (school_id, token, start_date, end_date)
  values (v_school_id, v_token, p_start_date, p_end_date);
  return v_token;
end;
$$;
grant execute on function public.create_schedule_share(date, date) to authenticated;

-- get_public_schedule(): token geçerliyse okulun adını + o aralıktaki
-- atamaları döner, süresi dolmuş/yanlış token'da hata fırlatır. anon'a
-- (girişsiz ziyaretçi) da execute izni var — paylaşılan link herkese açık.
create or replace function public.get_public_schedule(p_token text)
returns table (
  school_name text,
  duty_date date,
  zone_name text,
  teacher_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from schedule_shares where token = p_token and expires_at > now()) then
    raise exception 'Bağlantı geçersiz veya süresi dolmuş.';
  end if;

  return query
  select s.name, da.duty_date, dz.name, t.full_name
  from schedule_shares ss
  join schools s on s.id = ss.school_id
  join duty_assignments da on da.school_id = ss.school_id
    and da.duty_date between ss.start_date and ss.end_date
  join duty_zones dz on dz.id = da.zone_id
  join teachers t on t.id = da.teacher_id
  where ss.token = p_token
  order by da.duty_date;
end;
$$;
grant execute on function public.get_public_schedule(text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PURCHASE_INTENTS — Premium ekranındaki "Premium'a Geç" CTA'sının
-- kaydı. Gerçek ödeme sağlayıcısı bağlı değil (bkz. lib/payments/,
-- Faz 10) — bu tablo süper adminin "Abonelik Düzenle" ile okulu elle
-- active yapmadan önce hangi okulun talep ettiğini görmesi için.
create table if not exists public.purchase_intents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  contact_name text,
  contact_phone text,
  note text,
  status text not null default 'new' check (status in ('new', 'contacted', 'done')),
  created_at timestamptz not null default now()
);

alter table public.purchase_intents enable row level security;

-- Kendi okulu için ekleyebilir, okuyamaz (okuma süper admin RPC'sinde,
-- bkz. Faz 10 platform_list_purchase_intents) — enterprise_leads'teki
-- gibi "yaz ama başkasının/kendi taleplerini de listeleyip karıştırma"
-- deseni.
drop policy if exists "purchase_intents_insert_own_school" on public.purchase_intents;
create policy "purchase_intents_insert_own_school" on public.purchase_intents
  for insert with check (school_id = public.current_school_id());

grant insert on public.purchase_intents to authenticated;
