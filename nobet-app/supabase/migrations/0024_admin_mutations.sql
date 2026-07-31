-- ═══════════════════════════════════════════════════════════════
-- ADMIN MUTASYONLARI — reason zorunlu + yeni işlemler (reopen/adjust quota/cancel)
-- ═══════════════════════════════════════════════════════════════
-- Y4 bulgusunun tamamlanması: window.confirm kaldırıldı (bkz.
-- ConfirmActionModal.jsx), burada da DB seviyesinde "işlem nedeni
-- zorunlu" kuralı uygulanıyor — sadece UI'ya güvenilmiyor, RPC boş/null
-- reason'ı reddediyor (imza AYNI kalıyor, p_reason hâlâ "default null"
-- ama gövde artık boşsa hata veriyor — signature'ı tekrar değiştirip
-- var olan çağrıları kırmaya gerek yok).

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
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'İşlem nedeni zorunlu.';
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

  select to_jsonb(s.*) into v_before from subscriptions s where school_id = p_school_id;
  update subscriptions
  set status = p_status, plan_type = p_plan_type, trial_ends_at = p_trial_ends_at, current_period_end = p_current_period_end
  where school_id = p_school_id;
  select to_jsonb(s.*) into v_after from subscriptions s where school_id = p_school_id;

  perform platform_write_audit_log('subscription.set', 'subscription', p_school_id, p_school_id, v_before, v_after, p_reason);
end;
$$;
grant execute on function public.platform_set_subscription(uuid, text, text, timestamptz, timestamptz, text) to authenticated;

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
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'İşlem nedeni zorunlu.';
  end if;
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

-- ── platform_reopen_school(): dondurulmuş/süresi dolmuş/iptal edilmiş
-- bir hesabı 'active' durumuna geri döndürür. ────────────────────────
create or replace function public.platform_reopen_school(p_school_id uuid, p_reason text default null)
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
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'İşlem nedeni zorunlu.';
  end if;
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  select to_jsonb(s.*) into v_before from subscriptions s where school_id = p_school_id;
  update subscriptions set status = 'active' where school_id = p_school_id;
  select to_jsonb(s.*) into v_after from subscriptions s where school_id = p_school_id;

  perform platform_write_audit_log('subscription.reopen', 'subscription', p_school_id, p_school_id, v_before, v_after, p_reason);
end;
$$;
grant execute on function public.platform_reopen_school(uuid, text) to authenticated;

-- ── platform_cancel_subscription(): müşteri/admin kararıyla iptal. ────
create or replace function public.platform_cancel_subscription(p_school_id uuid, p_reason text default null)
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
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'İşlem nedeni zorunlu.';
  end if;
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  select to_jsonb(s.*) into v_before from subscriptions s where school_id = p_school_id;
  update subscriptions set status = 'cancelled' where school_id = p_school_id;
  select to_jsonb(s.*) into v_after from subscriptions s where school_id = p_school_id;

  perform platform_write_audit_log('subscription.cancel', 'subscription', p_school_id, p_school_id, v_before, v_after, p_reason);
end;
$$;
grant execute on function public.platform_cancel_subscription(uuid, text) to authenticated;

-- ── platform_adjust_free_quota(): ücretsiz plan üretim kotasını
-- artırır/değiştirir (bkz. 0020_subscription_model_v2.sql
-- free_generation_quota). ─────────────────────────────────────────
create or replace function public.platform_adjust_free_quota(p_school_id uuid, p_new_quota int, p_reason text default null)
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
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'İşlem nedeni zorunlu.';
  end if;
  if p_new_quota is null or p_new_quota < 0 then
    raise exception 'Kota negatif olamaz.';
  end if;
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  select to_jsonb(s.*) into v_before from subscriptions s where school_id = p_school_id;
  update subscriptions set free_generation_quota = p_new_quota where school_id = p_school_id;
  select to_jsonb(s.*) into v_after from subscriptions s where school_id = p_school_id;

  perform platform_write_audit_log('subscription.adjust_quota', 'subscription', p_school_id, p_school_id, v_before, v_after, p_reason);
end;
$$;
grant execute on function public.platform_adjust_free_quota(uuid, int, text) to authenticated;
