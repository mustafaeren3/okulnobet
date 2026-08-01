-- ═══════════════════════════════════════════════════════════════
-- SÜPER ADMIN DASHBOARD — özet kartlar + grafik verisi tek RPC'de
-- ═══════════════════════════════════════════════════════════════
-- Diğer platform_* fonksiyonlarıyla AYNI desen: platform_require_admin()
-- ilk satır (MFA/aal2 dahil), SECURITY DEFINER (RLS bypass — çapraz-okul/
-- çapraz-kullanıcı okuma burada BİLİNÇLİ, dar kapsamlı bir fonksiyonla).
-- Tek jsonb dönüyor (skalerler + zaman serileri) — İstemci tarafında
-- ayrı ayrı sorgu atmak yerine tek round-trip.
create or replace function public.platform_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform platform_require_admin();

  select jsonb_build_object(
    -- ── Özet kartlar ──────────────────────────────────────────
    'total_users', (select count(*) from auth.users),
    'signups_today', (select count(*) from auth.users where created_at >= date_trunc('day', now())),
    'signups_last_7_days', (select count(*) from auth.users where created_at >= now() - interval '7 days'),
    'signups_last_30_days', (select count(*) from auth.users where created_at >= now() - interval '30 days'),
    'active_schools', (select count(*) from subscriptions where status = 'active'),
    'total_duty_assignments', (select count(*) from duty_assignments),
    'duty_assignments_today', (select count(*) from duty_assignments where created_at >= date_trunc('day', now())),
    'active_subscriptions', (select count(*) from subscriptions where status = 'active' and plan_type in ('standard', 'enterprise')),
    'free_plan_count', (select count(*) from subscriptions where plan_type = 'free'),
    'expired_or_frozen_count', (select count(*) from subscriptions where status in ('expired', 'past_due', 'cancelled', 'frozen')),
    'total_teachers', (select count(*) from teachers),
    'total_schools', (select count(*) from schools),

    -- ── Grafikler ─────────────────────────────────────────────
    'daily_signups', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.day), '[]'::jsonb)
      from (
        select to_char(d, 'YYYY-MM-DD') as day,
          (select count(*) from auth.users u where u.created_at >= d and u.created_at < d + interval '1 day') as count
        from generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') as d
      ) t
    ),
    'weekly_signups', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.week_start), '[]'::jsonb)
      from (
        select to_char(w, 'YYYY-MM-DD') as week_start,
          (select count(*) from auth.users u where u.created_at >= w and u.created_at < w + interval '7 days') as count
        from generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '7 days') as w
      ) t
    ),
    'monthly_signups', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.month_start), '[]'::jsonb)
      from (
        select to_char(m, 'YYYY-MM') as month_start,
          (select count(*) from auth.users u where u.created_at >= m and u.created_at < m + interval '1 month') as count
        from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') as m
      ) t
    ),
    'school_type_distribution', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select coalesce(school_type, 'belirtilmemiş') as school_type, count(*) as count
        from schools
        group by coalesce(school_type, 'belirtilmemiş')
        order by count desc
      ) t
    ),
    'city_distribution', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select coalesce(nullif(city, ''), 'belirtilmemiş') as city, count(*) as count
        from schools
        group by coalesce(nullif(city, ''), 'belirtilmemiş')
        order by count desc
        limit 15
      ) t
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.platform_dashboard_stats() from public;
grant execute on function public.platform_dashboard_stats() to authenticated;
