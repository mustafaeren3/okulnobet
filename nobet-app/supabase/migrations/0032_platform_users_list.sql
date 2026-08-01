-- ═══════════════════════════════════════════════════════════════
-- KULLANICI YÖNETİMİ — platform_list_schools_page'i kullanıcı bilgisiyle genişlet
-- ═══════════════════════════════════════════════════════════════
-- YENİ TABLO YOK — bu ürün modelinde her okulun TEK sahibi var
-- (school_users, register_school her zaman tam 1 satır ekliyor, bkz.
-- supabase/migrations/0001+). Yani "kullanıcı yönetimi" ile "okul
-- yönetimi" aynı satırlar üzerinde iki farklı görünüm — ayrı bir
-- "users" tablosu/RPC'si icat etmek veriyi ikiye bölüp senkronizasyon
-- riski yaratırdı. Bunun yerine var olan platform_list_schools_page'e
-- auth.users + school_users LEFT JOIN LATERAL ile kullanıcı alanları
-- (email/ad soyad/son giriş) ekleniyor — okulun 0 veya (teorik olarak)
-- 1'den fazla kullanıcısı olsa bile LATERAL + LIMIT 1 sayesinde
-- sayfalama satır çoğalması yaşamıyor.
--
-- p_quick_filter: Dashboard kartlarının ("Bugün kayıt olanlar", "Trial
-- kullanıcılar", "Premium kullanıcılar", "Son giriş yapanlar") tıklanınca
-- açacağı hazır filtreler — her biri ayrı ayrı p_created_from/p_plan/
-- p_sort kombinasyonu yazmak yerine TEK parametre, İSTEMCİDE mantık
-- tekrarlanmasın diye sunucu tarafında çözülüyor.
drop function if exists public.platform_list_schools_page(text, text, text, text, text, text, int, int);

create or replace function public.platform_list_schools_page(
  p_search text default null,
  p_city text default null,
  p_district text default null,
  p_plan text default null,
  p_status text default null,
  p_sort text default 'created_at_desc',
  p_page int default 1,
  p_page_size int default 25,
  p_quick_filter text default null
)
returns table (
  school_id uuid,
  school_name text,
  city text,
  district text,
  created_at timestamptz,
  teacher_count bigint,
  subscription_status text,
  plan_type text,
  last_generated_at timestamptz,
  total_count bigint,
  user_id uuid,
  email text,
  full_name text,
  last_sign_in_at timestamptz,
  trial_ends_at timestamptz,
  free_generation_quota int,
  free_generation_used int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 25), 1), 100);
  v_offset int := (v_page - 1) * v_page_size;
  v_today timestamptz := date_trunc('day', now());
begin
  perform platform_require_admin();

  if p_sort is not null and p_sort not in (
    'created_at_desc', 'created_at_asc', 'name_asc', 'name_desc',
    'teacher_count_desc', 'last_login_desc', 'last_login_asc'
  ) then
    raise exception 'Geçersiz sıralama.';
  end if;
  if p_plan is not null and p_plan not in ('free', 'standard', 'enterprise') then
    raise exception 'Geçersiz plan filtresi.';
  end if;
  if p_status is not null and p_status not in ('active', 'past_due', 'expired', 'cancelled', 'frozen') then
    raise exception 'Geçersiz durum filtresi.';
  end if;
  if p_search is not null and length(p_search) > 200 then
    raise exception 'Arama terimi çok uzun.';
  end if;
  if p_quick_filter is not null and p_quick_filter not in ('today_signup', 'week_signup', 'month_signup', 'trial', 'premium', 'recent_login') then
    raise exception 'Geçersiz hazır filtre.';
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
    (select max(da.created_at) from duty_assignments da where da.school_id = s.id and da.is_manual = false),
    count(*) over()::bigint,
    owner.user_id,
    owner.email,
    coalesce(owner.raw_user_meta_data ->> 'full_name', ''),
    owner.last_sign_in_at,
    sub.trial_ends_at,
    sub.free_generation_quota,
    sub.free_generation_used
  from schools s
  left join subscriptions sub on sub.school_id = s.id
  left join lateral (
    select su.user_id, u.email, u.raw_user_meta_data, u.last_sign_in_at, u.created_at as user_created_at
    from school_users su
    join auth.users u on u.id = su.user_id
    where su.school_id = s.id
    order by (su.role = 'admin') desc, su.created_at asc
    limit 1
  ) owner on true
  where (p_search is null or s.name ilike '%' || p_search || '%' or owner.email ilike '%' || p_search || '%' or owner.raw_user_meta_data ->> 'full_name' ilike '%' || p_search || '%')
    and (p_city is null or s.city = p_city)
    and (p_district is null or s.district = p_district)
    and (p_plan is null or sub.plan_type = p_plan)
    and (p_status is null or sub.status = p_status)
    and (p_quick_filter is null
      or (p_quick_filter = 'today_signup' and owner.user_created_at >= v_today)
      or (p_quick_filter = 'week_signup' and owner.user_created_at >= now() - interval '7 days')
      or (p_quick_filter = 'month_signup' and owner.user_created_at >= now() - interval '30 days')
      or (p_quick_filter = 'trial' and sub.plan_type = 'free')
      or (p_quick_filter = 'premium' and sub.plan_type in ('standard', 'enterprise') and sub.status = 'active')
      or (p_quick_filter = 'recent_login' and owner.last_sign_in_at is not null)
    )
  order by
    case when p_sort = 'created_at_asc' then s.created_at end asc nulls last,
    case when p_sort = 'name_asc' then s.name end asc nulls last,
    case when p_sort = 'name_desc' then s.name end desc nulls last,
    case when p_sort = 'teacher_count_desc' then (select count(*) from teachers t where t.school_id = s.id and t.is_active) end desc nulls last,
    case when p_sort = 'last_login_desc' or p_quick_filter = 'recent_login' then owner.last_sign_in_at end desc nulls last,
    case when p_sort = 'last_login_asc' then owner.last_sign_in_at end asc nulls last,
    s.created_at desc
  limit v_page_size offset v_offset;
end;
$$;

revoke all on function public.platform_list_schools_page(text, text, text, text, text, text, int, int, text) from public;
grant execute on function public.platform_list_schools_page(text, text, text, text, text, text, int, int, text) to authenticated;
