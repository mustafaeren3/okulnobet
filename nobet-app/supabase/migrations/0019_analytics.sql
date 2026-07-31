-- ═══════════════════════════════════════════════════════════════
-- ANALYTICS — platform_list_schools()'u Faz 9'daki schedule_generations
-- tablosundan türeyen okul-bazlı metriklerle genişletir.
-- ═══════════════════════════════════════════════════════════════
-- "Tahmini kazanılan zaman" gibi türetilmiş metrikler BİLEREK burada
-- hesaplanmıyor — SQL sadece HAM sayıları (generation_count,
-- total_duty_count, ...) döner, dakika/saat çevrimi lib/engine/fairness.js
-- estimateMinutesSaved() ile (JS tarafında, tek yerde) yapılır. Aksi
-- halde "atama başına 3 dakika" sabiti hem SQL'de hem JS'te ayrı ayrı
-- yaşar ve bir gün birbirinden sapar.

drop function if exists public.platform_list_schools();

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
