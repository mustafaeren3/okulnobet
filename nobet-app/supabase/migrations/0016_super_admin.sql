-- ═══════════════════════════════════════════════════════════════
-- SÜPER ADMIN PANELİ — platform sahibinin TÜM okulları görebildiği/
-- yönetebildiği ilk çapraz-okul (cross-tenant) özellik.
-- ═══════════════════════════════════════════════════════════════
-- Bugüne kadar HER RLS politikası current_school_id()'ye göre satır
-- bazlı izole ediyordu (bir okul başka bir okulu asla göremez). Süper
-- admin bunun BİLİNÇLİ istisnası — bu yüzden geniş bir RLS-bypass
-- politikası yerine (yanlışlıkla her authenticated kullanıcıya sızma
-- riski taşır), 0001'deki register_school ile AYNI desen kullanılıyor:
-- dar kapsamlı SECURITY DEFINER fonksiyonlar, her biri kendi içinde
-- platform_admins üyeliğini kontrol edip yetkisizse exception fırlatır.
-- Program/component'lar bu fonksiyonların DIŞINDA schools/subscriptions
-- tablolarına çapraz-okul sorgusu ATAMAZ (RLS zaten engeller).

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
-- Kimse doğrudan okuyup yazamaz — sadece aşağıdaki SECURITY DEFINER
-- fonksiyonlar dokunur (trial_registrations, 0013 ile aynı desen).
revoke all on public.platform_admins from authenticated;

-- subscriptions.status'a 'frozen' eklendi (süper admin bir okulu
-- ödeme sorunu/suistimal gibi nedenlerle geçici durdurabilsin —
-- 'canceled'dan farklı: müşterinin kendi iptali değil, admin kararı).
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('trialing', 'active', 'expired', 'canceled', 'frozen'));

-- ── platform_is_admin(): oturum sahibi süper admin mi? ────────────
create or replace function public.platform_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;
grant execute on function public.platform_is_admin() to authenticated;

-- ── platform_list_schools(): tüm okullar + abonelik + öğretmen sayısı
-- + son program üretim zamanı (canlı kullanım göstergesi). ───────────
create or replace function public.platform_list_schools()
returns table (
  school_id uuid,
  school_name text,
  city text,
  district text,
  created_at timestamptz,
  teacher_count bigint,
  subscription_status text,
  plan_type text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  last_generated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not platform_is_admin() then
    raise exception 'Yetkiniz yok.';
  end if;

  return query
  select
    s.id,
    s.name,
    s.city,
    s.district,
    s.created_at,
    (select count(*) from teachers t where t.school_id = s.id and t.is_active),
    sub.status,
    sub.plan_type,
    sub.trial_ends_at,
    sub.current_period_end,
    (select max(da.created_at) from duty_assignments da where da.school_id = s.id and da.is_manual = false)
  from schools s
  left join subscriptions sub on sub.school_id = s.id
  order by s.created_at desc;
end;
$$;
grant execute on function public.platform_list_schools() to authenticated;

-- ── platform_extend_trial(): deneme süresini uzat. Süresi dolmuşsa
-- (expired) yeniden kullanılabilir hale getirir (trialing); bilerek
-- 'frozen'/'canceled' durumunu KENDİLİĞİNDEN geri açmaz — bunlar ayrı,
-- kasıtlı admin kararları, sadece deneme uzatmakla karışmamalı. ─────
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
      status = case when status = 'expired' then 'trialing' else status end
  where school_id = p_school_id;
end;
$$;
grant execute on function public.platform_extend_trial(uuid, int) to authenticated;

-- ── platform_set_subscription(): manuel abonelik tanımlama (tam
-- kontrol) — durum, plan, deneme/dönem bitiş tarihleri. ─────────────
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
  if p_status not in ('trialing', 'active', 'expired', 'canceled', 'frozen') then
    raise exception 'Geçersiz durum: %', p_status;
  end if;
  if p_plan_type not in ('trial', 'standard') then
    raise exception 'Geçersiz plan: %', p_plan_type;
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

-- ── platform_freeze_school(): hızlı dondurma kısayolu. Dondurmayı
-- kaldırmak için ayrı bir "unfreeze" yok — bilerek: neye geri
-- döneceği (trialing mi, active mi) tek bir doğru cevabı olmayan bir
-- karar, admin bunun için zaten genel platform_set_subscription'ı
-- kullanır. ───────────────────────────────────────────────────────
create or replace function public.platform_freeze_school(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not platform_is_admin() then
    raise exception 'Yetkiniz yok.';
  end if;
  update subscriptions set status = 'frozen' where school_id = p_school_id;
end;
$$;
grant execute on function public.platform_freeze_school(uuid) to authenticated;
