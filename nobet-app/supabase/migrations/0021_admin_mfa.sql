-- ═══════════════════════════════════════════════════════════════
-- ADMIN MFA ZORUNLULUĞU — platform_admins rol ayrımı + AAL2 kontrolü
-- ═══════════════════════════════════════════════════════════════
-- Güvenlik denetimi bulgusu (K1): admin paneli şimdiye kadar sadece
-- "platform_admins'te satırın var mı" sorusuna bakıyordu — parola tek
-- başına yeterliydi. Artık İKİ koşul birlikte gerekiyor: (1) aktif admin
-- üyeliği, (2) oturumun Supabase MFA Authenticator Assurance Level'i
-- 'aal2' (TOTP ile doğrulanmış). MFA faktörlerinin kendisi (TOTP
-- secret/kod) Supabase Auth'un kendi auth.mfa_factors tablosunda tutulur
-- — burada YENİDEN bir "admin_mfa_factors" şeması KURULMUYOR, sadece
-- auth.jwt()->>'aal' okunuyor (Supabase'in resmi/belgelenmiş deseni).

alter table public.platform_admins add column if not exists role text not null default 'admin' check (role in ('admin', 'owner'));
alter table public.platform_admins add column if not exists revoked_at timestamptz;
alter table public.platform_admins add column if not exists granted_by uuid references auth.users(id);

-- Var olan satırlar (ilk kurulumda elle eklenmiş olabilir) 'owner' yapılır
-- — bu migration kimseyi dışarıda bırakmasın diye (aksi halde "admin
-- ekleyecek owner yok" kilitlenmesi olurdu).
update public.platform_admins set role = 'owner' where role = 'admin';

-- ── platform_require_admin(): TÜM admin RPC'lerinin İLK satırı ──────
-- Admin üyeliği (revoked_at is null) VE aal2 birlikte sağlanmazsa
-- exception fırlatır. auth.jwt() Supabase'in her PostgREST/RPC isteğinde
-- otomatik sağladığı, geçerli JWT claim'lerini döndüren yerleşik
-- fonksiyon — 'aal' claim'i istemcinin göndermesi değil, Supabase Auth
-- sunucusunun İMZALADIĞI token içinde geliyor, sahtesi yapılamaz.
create or replace function public.platform_require_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from platform_admins
    where user_id = auth.uid() and revoked_at is null
  ) then
    raise exception 'Yetkiniz yok.';
  end if;
  if coalesce(auth.jwt()->>'aal', '') <> 'aal2' then
    raise exception 'Bu işlem için MFA doğrulaması gerekli.';
  end if;
end;
$$;
grant execute on function public.platform_require_admin() to authenticated;

create or replace function public.platform_require_owner()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  if not exists (
    select 1 from platform_admins
    where user_id = auth.uid() and revoked_at is null and role = 'owner'
  ) then
    raise exception 'Bu işlem için owner yetkisi gerekli.';
  end if;
end;
$$;
grant execute on function public.platform_require_owner() to authenticated;

-- ── platform_grant_admin() / platform_revoke_admin(): owner-only ────
-- Admin ekleme/çıkarma artık uygulama içinden yapılabiliyor (Y3 bulgusu)
-- ama sadece 'owner' rolündeki bir admin, kendisi de aal2 ile.
create or replace function public.platform_grant_admin(p_email text, p_role text default 'admin')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
begin
  perform platform_require_owner();

  if p_role not in ('admin', 'owner') then
    raise exception 'Geçersiz rol: %', p_role;
  end if;

  select id into v_target_user_id from auth.users where lower(email) = lower(p_email);
  if v_target_user_id is null then
    raise exception 'Bu e-posta ile bir kullanıcı bulunamadı. Önce hesap oluşturmalı.';
  end if;

  insert into platform_admins (user_id, role, granted_by)
  values (v_target_user_id, p_role, auth.uid())
  on conflict (user_id) do update set role = excluded.role, revoked_at = null, granted_by = excluded.granted_by;
end;
$$;
grant execute on function public.platform_grant_admin(text, text) to authenticated;

create or replace function public.platform_revoke_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_owner();

  if p_user_id = auth.uid() then
    raise exception 'Kendi admin yetkini kaldıramazsın — başka bir owner''dan iste.';
  end if;

  update platform_admins set revoked_at = now() where user_id = p_user_id;
end;
$$;
grant execute on function public.platform_revoke_admin(uuid) to authenticated;

-- ── Var olan tüm platform_* fonksiyonları platform_require_admin()
-- kullanacak şekilde create or replace edilir — davranış: artık MFA'sız
-- (aal1) hiçbiri çalışmaz. platform_is_admin() BİLEREK dokunulmuyor —
-- sadece "admin üyeliği var mı" (MFA'sız) sorusuna cevap veriyor, sayfa
-- yönlendirme mantığının "admin ama MFA eksik -> /super-admin/mfa"
-- kararını verebilmesi için ayrı tutulması gerekiyor (bkz.
-- app/super-admin/page.jsx).

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
  last_generated_at timestamptz,
  generation_count bigint,
  avg_duration_ms numeric,
  manual_change_count bigint,
  total_duty_count bigint,
  last_login_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();

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
    (select max(da.created_at) from duty_assignments da where da.school_id = s.id and da.is_manual = false),
    (select count(*) from schedule_generations sg where sg.school_id = s.id),
    (select avg(sg.duration_ms) from schedule_generations sg where sg.school_id = s.id),
    (select count(*) from duty_assignments da where da.school_id = s.id and da.is_manual = true),
    (select coalesce(sum(sg.created_count), 0) from schedule_generations sg where sg.school_id = s.id),
    (select max(u.last_sign_in_at) from school_users su join auth.users u on u.id = su.user_id where su.school_id = s.id)
  from schools s
  left join subscriptions sub on sub.school_id = s.id
  order by s.created_at desc;
end;
$$;
grant execute on function public.platform_list_schools() to authenticated;

create or replace function public.platform_extend_trial(p_school_id uuid, p_days int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  if p_days is null or p_days <= 0 then
    raise exception 'Gün sayısı pozitif olmalı.';
  end if;
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  update subscriptions
  set trial_ends_at = greatest(coalesce(trial_ends_at, now()), now()) + (p_days || ' days')::interval,
      status = case when status = 'expired' then 'active' else status end
  where school_id = p_school_id;
end;
$$;
grant execute on function public.platform_extend_trial(uuid, int) to authenticated;

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
  perform platform_require_admin();
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

create or replace function public.platform_freeze_school(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;
  update subscriptions set status = 'frozen' where school_id = p_school_id;
end;
$$;
grant execute on function public.platform_freeze_school(uuid) to authenticated;

create or replace function public.platform_list_enterprise_leads()
returns setof public.enterprise_leads
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  return query select * from enterprise_leads order by created_at desc;
end;
$$;
grant execute on function public.platform_list_enterprise_leads() to authenticated;

create or replace function public.platform_list_purchase_intents()
returns table (
  id uuid,
  school_id uuid,
  school_name text,
  contact_name text,
  contact_phone text,
  note text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  return query
  select pi.id, pi.school_id, s.name, pi.contact_name, pi.contact_phone, pi.note, pi.status, pi.created_at
  from purchase_intents pi
  join schools s on s.id = pi.school_id
  order by pi.created_at desc;
end;
$$;
grant execute on function public.platform_list_purchase_intents() to authenticated;
