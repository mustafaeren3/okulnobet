-- service_role'e email_log/email_log_events üzerinde SADECE SELECT —
-- yazma hâlâ SADECE RPC'ler üzerinden (log_email_pending/record_email_event/
-- mark_email_verified), least-privilege korunuyor. Bu grant olmadan da
-- webhook/RPC akışı çalışıyor (SECURITY DEFINER fonksiyonlar sahiplerinin
-- yetkisiyle çalışır) — bu SADECE gözlemlenebilirlik/debug için (ör.
-- service-role client'la doğrudan sorgu).
grant select on public.email_log to service_role;
grant select on public.email_log_events to service_role;
