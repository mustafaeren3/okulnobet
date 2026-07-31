-- ═══════════════════════════════════════════════════════════════
-- ABONELİK VERİ MODELİ v2 — trial tabanlı modelin şemadan da kaldırılması
-- ═══════════════════════════════════════════════════════════════
-- Faz 9'da "ücretsiz plan artık zaman bazlı bitmiyor" ürün kararı
-- alınmıştı (bkz. lib/engine/subscription.js) ama şema hâlâ eski
-- isimleri (plan_type='trial', status='trialing') taşıyordu. Bu
-- migration TEK SEFERLİK bir temiz geçiş yapıyor — canlıda gerçek ödeme
-- yapan müşteri yok (ödeme entegrasyonu hâlâ bağlı değil, bkz.
-- lib/payments/mock.js), bu yüzden eski/yeni değerleri birlikte
-- yaşatan iki fazlı bir geçişe gerek görülmedi (kullanıcı onayı).
--
-- plan_type: 'trial' -> 'free' (+ yeni 'enterprise')
-- status:    'trialing' -> 'active', 'canceled' -> 'cancelled' (+ yeni 'past_due')
--
-- Sıra ÖNEMLİ: önce constraint'i YENİ+ESKİ değerlerin ikisini de kabul
-- edecek şekilde gevşetiyoruz, veriyi UPDATE ediyoruz, SONRA constraint'i
-- sadece yeni 5 değere sıkılaştırıyoruz — ara adımda constraint ihlali
-- olmasın diye.

alter table public.subscriptions drop constraint if exists subscriptions_plan_type_check;
alter table public.subscriptions add constraint subscriptions_plan_type_check
  check (plan_type in ('trial', 'free', 'standard', 'enterprise'));

alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('trialing', 'active', 'past_due', 'expired', 'canceled', 'cancelled', 'frozen'));

update public.subscriptions set plan_type = 'free' where plan_type = 'trial';
update public.subscriptions set status = 'active' where status = 'trialing';
update public.subscriptions set status = 'cancelled' where status = 'canceled';

alter table public.subscriptions drop constraint if exists subscriptions_plan_type_check;
alter table public.subscriptions add constraint subscriptions_plan_type_check
  check (plan_type in ('free', 'standard', 'enterprise'));

alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('active', 'past_due', 'expired', 'cancelled', 'frozen'));

-- ── Ücretsiz üretim kotası: boolean bayraktan sayısala ──────────────
-- Eskiden "trial_schedule_generated_at dolu mu" (1 kez, sabit) diye
-- bakılıyordu. Artık süper admin kotayı ARTIRABİLSİN diye sayısal:
-- free_generation_quota (varsayılan 1) / free_generation_used.
alter table public.subscriptions add column if not exists free_generation_quota int not null default 1;
alter table public.subscriptions add column if not exists free_generation_used int not null default 0;

update public.subscriptions
set free_generation_used = 1
where trial_schedule_generated_at is not null and free_generation_used = 0;

-- trial_schedule_generated_at ve trial_ends_at ARTIK okunmuyor (kod
-- tarafında da kaldırılıyor) ama geriye dönük iz/denetim için sütunlar
-- silinmiyor — sadece kullanılmıyor.

-- ── register_school: yeni okul artık kalıcı ücretsiz plan ile açılır ──
-- İmza AYNI (p_name, p_city, p_district, p_phone) — sadece gövdedeki
-- INSERT değerleri değişti, eski çağıranlar etkilenmez.
create or replace function public.register_school(
  p_name text,
  p_city text,
  p_district text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_school_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapılmamış kullanıcı okul oluşturamaz';
  end if;

  if exists (select 1 from school_users where user_id = auth.uid()) then
    raise exception 'Bu kullanıcı zaten bir okula bağlı';
  end if;

  if p_phone is null or length(trim(p_phone)) = 0 then
    raise exception 'Telefon numarası gerekli';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  if exists (
    select 1 from trial_registrations
    where lower(email) = lower(v_email) or phone = p_phone
  ) then
    raise exception 'Bu e-posta adresi veya telefon numarasıyla daha önce bir hesap oluşturulmuş. Devam etmek için abonelik satın almanız gerekiyor.';
  end if;

  insert into schools (name, city, district)
  values (p_name, p_city, p_district)
  returning id into new_school_id;

  insert into school_users (user_id, school_id, role)
  values (auth.uid(), new_school_id, 'admin');

  insert into settings (school_id, start_date, end_date)
  values (new_school_id, '2026-09-14', '2027-06-25');

  insert into subscriptions (school_id, plan_type, status)
  values (new_school_id, 'free', 'active');

  insert into trial_registrations (email, phone, school_id)
  values (v_email, p_phone, new_school_id);

  return new_school_id;
end;
$$;

grant execute on function public.register_school(text, text, text, text) to authenticated;

-- ── platform_set_subscription: yeni değer setine göre doğrulama ──────
create or replace function public.platform_set_subscription(
  p_school_id uuid,
  p_status text,
  p_plan_type text,
  p_trial_ends_at timestamptz,
  p_current_period_end timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not platform_is_admin() then
    raise exception 'Yetkiniz yok.';
  end if;
  if p_status not in ('active', 'past_due', 'expired', 'cancelled', 'frozen') then
    raise exception 'Geçersiz durum: %', p_status;
  end if;
  if p_plan_type not in ('free', 'standard', 'enterprise') then
    raise exception 'Geçersiz plan: %', p_plan_type;
  end if;
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  update subscriptions
  set status = p_status,
      plan_type = p_plan_type,
      trial_ends_at = p_trial_ends_at,
      current_period_end = p_current_period_end
  where school_id = p_school_id;
end;
$$;
grant execute on function public.platform_set_subscription(uuid, text, text, timestamptz, timestamptz) to authenticated;

-- ── increment_free_generation_usage(): mark_trial_schedule_generated'ın
-- yerini alıyor. Eskisi boolean bir bayrağı (varsa dokunma) set ediyordu;
-- artık kota sayısal ve süper admin artırabildiği için HER gerçek
-- (dryRun=false) ücretsiz üretimde 1 artırılması gerekiyor — idempotency
-- koruması YOK, bkz. lib/db/bulkSchedule.js (her başarılı üretimde tam
-- bir kez çağrılıyor).
create or replace function public.increment_free_generation_usage()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update subscriptions
  set free_generation_used = free_generation_used + 1
  where school_id = current_school_id();
end;
$$;
grant execute on function public.increment_free_generation_usage() to authenticated;

-- Eski boolean-bayrak fonksiyonu artık hiçbir yerden çağrılmıyor (bkz.
-- lib/db/bulkSchedule.js — increment_free_generation_usage'a geçti).
drop function if exists public.mark_trial_schedule_generated();

-- ── platform_extend_trial: artık var olmayan 'trialing' durumuna dönmesin ──
-- Eski gövde expired bir okulu 'trialing'e döndürüyordu — bu değer artık
-- constraint'te yok (yukarıda kaldırıldı), çağrılırsa hata verirdi. Yeni
-- model: expired bir okul yeniden açılınca 'active' olur. (Bu özelliğin
-- kendisi artık büyük ölçüde anlamsız — trial zaman bazlı bitmiyor — ama
-- kaldırılması ayrı bir admin-panel fazı, bkz. PHASE_REPORT teknik borç.)
create or replace function public.platform_extend_trial(p_school_id uuid, p_days int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not platform_is_admin() then
    raise exception 'Yetkiniz yok.';
  end if;
  if p_days is null or p_days <= 0 then
    raise exception 'Gün sayısı pozitif olmalı.';
  end if;

  update subscriptions
  set trial_ends_at = greatest(coalesce(trial_ends_at, now()), now()) + (p_days || ' days')::interval,
      status = case when status = 'expired' then 'active' else status end
  where school_id = p_school_id;
end;
$$;
grant execute on function public.platform_extend_trial(uuid, int) to authenticated;
