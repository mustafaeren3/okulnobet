-- Email Merkezi "Detayı görüntüle" — tek bir email_log satırının ham
-- webhook olay geçmişini döner (id/provider/message id/event id/tür/
-- zaman — kullanıcının açıkça istediği alanlar).
create or replace function public.platform_get_email_log_events(p_email_log_id uuid)
returns setof public.email_log_events
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  return query
  select * from email_log_events
  where email_log_id = p_email_log_id
  order by occurred_at asc;
end;
$$;
revoke all on function public.platform_get_email_log_events(uuid) from public;
grant execute on function public.platform_get_email_log_events(uuid) to authenticated;
