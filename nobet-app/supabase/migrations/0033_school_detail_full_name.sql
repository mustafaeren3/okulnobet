-- platform_get_school_detail'in 'users' dizisine full_name eklendi —
-- Kullanıcı Yönetimi detay sayfası "Ad Soyad" gösterebilsin diye
-- (bkz. auth.users.raw_user_meta_data->>'full_name', signup sırasında
-- kaydediliyor, bkz. app/(auth)/signup/actions.js). Başka hiçbir alan
-- değişmedi.
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
        'user_id', su.user_id, 'role', su.role, 'email', u.email,
        'full_name', coalesce(u.raw_user_meta_data ->> 'full_name', ''),
        'last_sign_in_at', u.last_sign_in_at, 'created_at', u.created_at
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
