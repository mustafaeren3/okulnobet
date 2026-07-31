-- ═══════════════════════════════════════════════════════════════
-- OKULLAR SAYFASI — sunucu taraflı arama/filtre/sıralama/sayfalama
-- ═══════════════════════════════════════════════════════════════
-- Güvenlik denetimi bulgusu (D2): platform_list_schools() tüm okulları
-- tek seferde döndürüyordu. platform_list_schools() KALIYOR (Genel Bakış
-- özet kartları hâlâ tüm-okul agregasyonu istiyor) ama Okullar sayfası
-- artık bunu değil, aşağıdaki sayfalanmış RPC'yi çağırıyor.
--
-- SQL injection notu: p_sort kullanıcıdan geliyor ama HİÇBİR yerde
-- doğrudan bir SQL string'ine eklenmiyor (dynamic SQL/EXECUTE yok) —
-- sadece sabit bir CASE listesindeki değerlerden biriyle eşleşiyor mu
-- diye kontrol ediliyor, eşleşmiyorsa reddediliyor. ORDER BY da statik
-- CASE WHEN sütunlarıyla kuruluyor (p_sort TEK bir sabit değer olduğu
-- için tüm satırlarda aynı sütun aktif oluyor, NULL karışıklığı olmuyor).

create or replace function public.platform_list_schools_page(
  p_search text default null,
  p_city text default null,
  p_district text default null,
  p_plan text default null,
  p_status text default null,
  p_sort text default 'created_at_desc',
  p_page int default 1,
  p_page_size int default 25
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
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 25), 1), 100);
  v_offset int := (v_page - 1) * v_page_size;
begin
  perform platform_require_admin();

  if p_sort is not null and p_sort not in ('created_at_desc', 'created_at_asc', 'name_asc', 'name_desc', 'teacher_count_desc') then
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
    count(*) over()::bigint
  from schools s
  left join subscriptions sub on sub.school_id = s.id
  where (p_search is null or s.name ilike '%' || p_search || '%')
    and (p_city is null or s.city = p_city)
    and (p_district is null or s.district = p_district)
    and (p_plan is null or sub.plan_type = p_plan)
    and (p_status is null or sub.status = p_status)
  order by
    case when p_sort = 'created_at_asc' then s.created_at end asc nulls last,
    case when p_sort = 'name_asc' then s.name end asc nulls last,
    case when p_sort = 'name_desc' then s.name end desc nulls last,
    case when p_sort = 'teacher_count_desc' then (select count(*) from teachers t where t.school_id = s.id and t.is_active) end desc nulls last,
    s.created_at desc
  limit v_page_size offset v_offset;
end;
$$;
grant execute on function public.platform_list_schools_page(text, text, text, text, text, text, int, int) to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- SCHOOL_ADMIN_NOTES — okul detay sayfasındaki "Admin notları"
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.school_admin_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id),
  note text not null,
  created_at timestamptz not null default now()
);
alter table public.school_admin_notes enable row level security;
revoke all on public.school_admin_notes from authenticated, anon;

create or replace function public.platform_add_school_note(p_school_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'Not boş olamaz.';
  end if;
  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  insert into school_admin_notes (school_id, admin_user_id, note) values (p_school_id, auth.uid(), p_note);
  perform platform_write_audit_log('school.add_note', 'school', p_school_id, p_school_id, null, jsonb_build_object('note', p_note), null);
end;
$$;
grant execute on function public.platform_add_school_note(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- OKUL DETAY — genel bilgiler + kullanıcılar + abonelik/kota + program
-- geçmişi + kullanım analytics + admin notları tek çağrıda (jsonb).
-- "Var olmayan id" için sessizce null döner — hata mesajı iç yapı
-- sızdırmaz, çağıran taraf null'ı "okul bulunamadı" olarak yorumlar.
-- ═══════════════════════════════════════════════════════════════
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

-- ── platform_list_admins(): Ayarlar sayfasındaki admin yönetimi için ──
create or replace function public.platform_list_admins()
returns table (
  user_id uuid,
  email text,
  role text,
  granted_by_email text,
  revoked_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  return query
  select pa.user_id, u.email, pa.role, gb.email, pa.revoked_at, pa.created_at
  from platform_admins pa
  join auth.users u on u.id = pa.user_id
  left join auth.users gb on gb.id = pa.granted_by
  order by pa.created_at asc;
end;
$$;
grant execute on function public.platform_list_admins() to authenticated;
