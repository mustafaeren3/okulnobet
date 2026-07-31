-- ═══════════════════════════════════════════════════════════════
-- PAYMENTS — manuel ödeme kaydı (gerçek "Toplam Tahsilat" veri kaynağı)
-- ═══════════════════════════════════════════════════════════════
-- Gerçek bir ödeme sağlayıcısı bağlı değil (bkz. lib/payments/mock.js).
-- Admin banka havalesi/elden ödeme aldığında elle kaydediyor — bu tablo
-- "Toplam Tahsilat" metriğinin UYDURMA değil GERÇEK veri kaynağı olması
-- için var (kullanıcı onayı, bkz. plan Context bölümü).

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'TRY',
  method text,
  note text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
revoke all on public.payments from authenticated, anon;

create or replace function public.platform_record_payment(
  p_school_id uuid,
  p_amount numeric,
  p_method text,
  p_note text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
begin
  perform platform_require_admin();
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'İşlem nedeni zorunlu.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Tutar pozitif olmalı.';
  end if;
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  insert into payments (school_id, amount, method, note, recorded_by)
  values (p_school_id, p_amount, p_method, p_note, auth.uid())
  returning id into v_payment_id;

  perform platform_write_audit_log('payment.record', 'payment', v_payment_id, p_school_id, null, jsonb_build_object('amount', p_amount, 'method', p_method), p_reason);
end;
$$;
grant execute on function public.platform_record_payment(uuid, numeric, text, text, text) to authenticated;

create or replace function public.platform_list_payments(p_school_id uuid default null, p_limit int default 100)
returns setof public.payments
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  return query
  select * from payments
  where (p_school_id is null or school_id = p_school_id)
  order by created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;
grant execute on function public.platform_list_payments(uuid, int) to authenticated;

-- ── platform_get_school_detail: artık son ödemeleri de içeriyor ──────
create or replace function public.platform_get_school_detail(p_school_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  perform platform_require_admin();

  if not exists (select 1 from schools where id = p_school_id) then
    return null;
  end if;

  select jsonb_build_object(
    'school', jsonb_build_object('id', s.id, 'name', s.name, 'city', s.city, 'district', s.district, 'created_at', s.created_at),
    'subscription', to_jsonb(sub.*),
    'users', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', su.user_id, 'role', su.role, 'email', u.email, 'last_sign_in_at', u.last_sign_in_at
      )), '[]'::jsonb)
      from school_users su join auth.users u on u.id = su.user_id
      where su.school_id = p_school_id
    ),
    'recent_generations', (
      select coalesce(jsonb_agg(to_jsonb(g.*)), '[]'::jsonb)
      from (
        select created_at, duration_ms, created_count, conflict_count, fairness_score
        from schedule_generations where school_id = p_school_id
        order by created_at desc limit 10
      ) g
    ),
    'recent_payments', (
      select coalesce(jsonb_agg(to_jsonb(p.*)), '[]'::jsonb)
      from (
        select amount, currency, method, note, created_at
        from payments where school_id = p_school_id
        order by created_at desc limit 10
      ) p
    ),
    'admin_notes', (
      select coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'note', n.note, 'created_at', n.created_at, 'admin_email', u.email) order by n.created_at desc), '[]'::jsonb)
      from school_admin_notes n join auth.users u on u.id = n.admin_user_id
      where n.school_id = p_school_id
    ),
    'teacher_count', (select count(*) from teachers where school_id = p_school_id and is_active),
    'manual_change_count', (select count(*) from duty_assignments where school_id = p_school_id and is_manual = true),
    'total_duty_count', (select count(*) from duty_assignments where school_id = p_school_id)
  ) into v_result
  from schools s
  left join subscriptions sub on sub.school_id = s.id
  where s.id = p_school_id;

  return v_result;
end;
$$;
grant execute on function public.platform_get_school_detail(uuid) to authenticated;
