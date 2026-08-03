-- ═══════════════════════════════════════════════════════════════
-- KVKK: KAYITTA ZORUNLU ONAY + İSTEĞE BAĞLI PAZARLAMA İZNİ
-- ═══════════════════════════════════════════════════════════════
-- Kullanım Koşulları/Gizlilik Politikası onayı kayıt formunda ZORUNLU
-- (checkbox olmadan submit edilemez, ayrıca startSignup() server action'ı
-- da kontrol eder). Pazarlama izni AYRI ve isteğe bağlı bir checkbox —
-- işaretlenmese bile kayıt tamamlanır.
--
-- Alanlar school_users'a eklendi (schools/teachers değil): register_school()
-- bu tabloya SADECE kayıt olan kişi için tek satır yazıyor (bkz. 0001/0029 —
-- kullanıcı zaten bir okula bağlıysa yeniden kayıt engelleniyor), yani bu
-- tablo pratikte "kayıt olan kişinin profili" — KVKK onay/izin bilgisinin
-- doğal yeri burası, ayrı bir profiles tablosu YOK ve tek kullanım için
-- eklenmeyecek (CLAUDE.md sadelik kuralı).

alter table public.school_users
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists privacy_policy_version text,
  add column if not exists terms_version text;

-- register_school: p_school_type imzası (0029) + 3 yeni parametre.
-- İmza değiştiği için önce eski 4 parametreli fonksiyon düşürülüyor,
-- aksi halde create or replace ESKİSİNİ SİLMEZ, iki ayrı overload kalır
-- (bkz. 0029'daki aynı desen).
drop function if exists public.register_school(text, text, text, text);

create or replace function public.register_school(
  p_name text,
  p_city text,
  p_district text,
  p_school_type text,
  p_marketing_consent boolean default false,
  p_terms_version text default null,
  p_privacy_policy_version text default null
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

  if p_school_type is null or length(trim(p_school_type)) = 0 then
    raise exception 'Okul türü gerekli';
  end if;
  if p_school_type not in (
    'ilkokul','ortaokul','imam_hatip_ortaokulu','lise','anadolu_lisesi',
    'fen_lisesi','sosyal_bilimler_lisesi','imam_hatip_lisesi',
    'mesleki_teknik_lise','guzel_sanatlar_lisesi','spor_lisesi','anaokulu',
    'ozel_egitim','halk_egitim','diger_kurum','diger'
  ) then
    raise exception 'Geçersiz okul türü: %', p_school_type;
  end if;

  if p_terms_version is null or length(trim(p_terms_version)) = 0
     or p_privacy_policy_version is null or length(trim(p_privacy_policy_version)) = 0 then
    raise exception 'Kullanım Koşulları ve Gizlilik Politikası onayı gerekli';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  if exists (select 1 from trial_registrations where lower(email) = lower(v_email)) then
    raise exception 'Bu e-posta adresiyle daha önce bir hesap oluşturulmuş. Devam etmek için abonelik satın almanız gerekiyor.';
  end if;

  insert into schools (name, city, district, school_type)
  values (p_name, p_city, p_district, p_school_type)
  returning id into new_school_id;

  insert into school_users (
    user_id, school_id, role,
    marketing_consent, marketing_consent_at,
    terms_version, privacy_policy_version
  )
  values (
    auth.uid(), new_school_id, 'admin',
    coalesce(p_marketing_consent, false),
    case when p_marketing_consent then now() else null end,
    p_terms_version, p_privacy_policy_version
  );

  insert into settings (school_id, start_date, end_date)
  values (new_school_id, '2026-09-14', '2027-06-25');

  insert into subscriptions (school_id, plan_type, status)
  values (new_school_id, 'free', 'active');

  insert into trial_registrations (email, phone, school_id)
  values (v_email, null, new_school_id);

  return new_school_id;
end;
$$;

revoke all on function public.register_school(text, text, text, text, boolean, text, text) from public;
grant execute on function public.register_school(text, text, text, text, boolean, text, text) to authenticated;

-- ── Süper Admin: pazarlama izni istatistiği ─────────────────────
-- platform_dashboard_stats() imzası (jsonb, parametresiz) değişmiyor,
-- sadece sonuç objesine yeni bir anahtar ekleniyor — create or replace
-- yeterli, drop gerekmiyor (bkz. 0031).
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

    -- ── KVKK: pazarlama izni (school_users — kayıt olan kişi başına 1 satır) ──
    'marketing_consent_stats', jsonb_build_object(
      'total', (select count(*) from school_users),
      'granted', (select count(*) from school_users where marketing_consent),
      'not_granted', (select count(*) from school_users where not marketing_consent)
    ),

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
