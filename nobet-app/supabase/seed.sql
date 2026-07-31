-- ══════════════════════════════════════════════════════════════════
-- SADECE YEREL GELİŞTİRME (supabase start / db reset).
-- Bu dosya `supabase db push` ile ASLA uzak (production) veritabanına
-- gitmez — Supabase CLI seed.sql'i yalnızca yerel stack'e uygular.
-- Amaç: development ortamı ile production ortamını ayırmak —
-- production'daki güvenlik yapısı (MFA/aal2, RLS, audit log) migration
-- dosyalarında OLDUĞU GİBİ durur; buradaki gevşetme yalnızca localhost
-- Docker veritabanında yaşar.
-- ══════════════════════════════════════════════════════════════════

-- 1) MFA (aal2) şartını YERELDE kaldır: platform_require_admin'in
-- migration'daki (0021) tanımını, admin üyeliği kontrolünü KORUYARAK
-- ama aal2 kontrolü OLMADAN yeniden tanımla. platform_require_owner
-- bunu çağırdığı için otomatik olarak o da MFA'sız çalışır (owner rolü
-- kontrolü aynen durur).
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
  -- aal2 kontrolü BİLEREK yok — yerel geliştirme kolaylığı.
end;
$$;

-- 2) Yerel owner hesabı: mustafaerenmim@gmail.com / dev123456
-- (auth.users'a doğrudan insert — GoTrue'nun beklediği alanlar boş
-- string olmalı, NULL değil; identities satırı da zorunlu.)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'mustafaerenmim@gmail.com',
  crypt('dev123456', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}',
  now(), now(), '', '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object(
    'sub', '11111111-1111-1111-1111-111111111111',
    'email', 'mustafaerenmim@gmail.com',
    'email_verified', true
  ),
  'email', now(), now(), now()
)
on conflict do nothing;

-- 3) Owner'ı platform_admins'e ekle (role='owner') — /super-admin'e
-- doğrudan girer, owner-only işlemler (admin ekleme/çıkarma) da açık.
insert into public.platform_admins (user_id, role)
values ('11111111-1111-1111-1111-111111111111', 'owner')
on conflict (user_id) do update set role = 'owner', revoked_at = null;
