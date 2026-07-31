-- ═══════════════════════════════════════════════════════════════
-- ADMIN AUDIT LOG — değiştirilemez/silinemez denetim izi
-- ═══════════════════════════════════════════════════════════════
-- Güvenlik denetimi bulgusu (Y1): hiçbir admin mutasyonu iz bırakmıyordu.
-- Bu migration: (1) admin_audit_logs tablosu + UPDATE/DELETE'i tablo
-- seviyesinde engelleyen trigger (uygulama hatası ya da ileride yanlışlıkla
-- verilecek bir GRANT bile işe yaramaz), (2) yazma SADECE diğer platform_*
-- mutasyon fonksiyonlarının İÇİNDEN (aynı transaction'da) — client'ın
-- audit'i atlaması mümkün değil, (3) okuma sadece admin+aal2 RPC'si.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  school_id uuid references public.schools(id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  reason text,
  request_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;
-- Hiçbir policy YOK ve hiçbir grant YOK — authenticated/anon bu tabloyu
-- ne select ne insert ne update ne delete edebilir. Tek erişim yolu
-- aşağıdaki SECURITY DEFINER fonksiyonlar.
revoke all on public.admin_audit_logs from authenticated, anon;

-- Tablo seviyesinde ek koruma: UPDATE/DELETE her zaman reddedilir — bu,
-- "hiç grant yok" korumasının ÜSTÜNE bir savunma katmanı (ileride
-- yanlışlıkla bir GRANT eklenirse bile tetiklenir).
create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'admin_audit_logs kayıtları değiştirilemez veya silinemez.';
end;
$$;

drop trigger if exists admin_audit_logs_no_update on public.admin_audit_logs;
create trigger admin_audit_logs_no_update
  before update on public.admin_audit_logs
  for each row execute function public.prevent_audit_log_mutation();

drop trigger if exists admin_audit_logs_no_delete on public.admin_audit_logs;
create trigger admin_audit_logs_no_delete
  before delete on public.admin_audit_logs
  for each row execute function public.prevent_audit_log_mutation();

-- ── platform_write_audit_log(): İÇ yardımcı — BİLEREK authenticated'e
-- grant edilmiyor. Sadece başka bir SECURITY DEFINER fonksiyonun (owner
-- rolüyle çalıştığı için) içinden çağrılabilir, client doğrudan
-- çağıramaz (audit'i "boş" bir action/target ile kirletemez).
create or replace function public.platform_write_audit_log(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_school_id uuid,
  p_before jsonb,
  p_after jsonb,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into admin_audit_logs (admin_user_id, action, target_type, target_id, school_id, before_data, after_data, reason)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_school_id, p_before, p_after, p_reason);
end;
$$;
revoke all on function public.platform_write_audit_log(text, text, uuid, uuid, jsonb, jsonb, text) from public, authenticated, anon;

-- ── Okuma: platform_list_audit_logs() — admin+aal2. ──────────────────
create or replace function public.platform_list_audit_logs(p_limit int default 100, p_school_id uuid default null)
returns setof public.admin_audit_logs
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  return query
  select * from admin_audit_logs
  where (p_school_id is null or school_id = p_school_id)
  order by created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;
grant execute on function public.platform_list_audit_logs(int, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Mevcut mutasyon fonksiyonlarına reason parametresi + audit yazımı
-- ekleniyor (p_reason NULL olabilir — UI'nin reason'ı ZORUNLU kılması
-- Faz E'nin işi, DB seviyesinde şimdilik esnek bırakıldı ki mevcut
-- panel bu migration'dan hemen sonra kırılmasın).
-- ═══════════════════════════════════════════════════════════════

drop function if exists public.platform_set_subscription(uuid, text, text, timestamptz, timestamptz);
create or replace function public.platform_set_subscription(
  p_school_id uuid,
  p_status text,
  p_plan_type text,
  p_trial_ends_at timestamptz,
  p_current_period_end timestamptz,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb;
  v_after jsonb;
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

  select to_jsonb(s.*) into v_before from subscriptions s where school_id = p_school_id;

  update subscriptions
  set status = p_status,
      plan_type = p_plan_type,
      trial_ends_at = p_trial_ends_at,
      current_period_end = p_current_period_end
  where school_id = p_school_id;

  select to_jsonb(s.*) into v_after from subscriptions s where school_id = p_school_id;

  perform platform_write_audit_log('subscription.set', 'subscription', p_school_id, p_school_id, v_before, v_after, p_reason);
end;
$$;
grant execute on function public.platform_set_subscription(uuid, text, text, timestamptz, timestamptz, text) to authenticated;

drop function if exists public.platform_freeze_school(uuid);
create or replace function public.platform_freeze_school(p_school_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  perform platform_require_admin();
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  select to_jsonb(s.*) into v_before from subscriptions s where school_id = p_school_id;
  update subscriptions set status = 'frozen' where school_id = p_school_id;
  select to_jsonb(s.*) into v_after from subscriptions s where school_id = p_school_id;

  perform platform_write_audit_log('subscription.freeze', 'subscription', p_school_id, p_school_id, v_before, v_after, p_reason);
end;
$$;
grant execute on function public.platform_freeze_school(uuid, text) to authenticated;

drop function if exists public.platform_extend_trial(uuid, int);
create or replace function public.platform_extend_trial(p_school_id uuid, p_days int, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  perform platform_require_admin();
  if p_days is null or p_days <= 0 then
    raise exception 'Gün sayısı pozitif olmalı.';
  end if;
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  select to_jsonb(s.*) into v_before from subscriptions s where school_id = p_school_id;

  update subscriptions
  set trial_ends_at = greatest(coalesce(trial_ends_at, now()), now()) + (p_days || ' days')::interval,
      status = case when status = 'expired' then 'active' else status end
  where school_id = p_school_id;

  select to_jsonb(s.*) into v_after from subscriptions s where school_id = p_school_id;

  perform platform_write_audit_log('subscription.extend_trial', 'subscription', p_school_id, p_school_id, v_before, v_after, p_reason);
end;
$$;
grant execute on function public.platform_extend_trial(uuid, int, text) to authenticated;
