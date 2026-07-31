-- ═══════════════════════════════════════════════════════════════
-- GÜVENLİK SIKILAŞTIRMASI — PUBLIC execute revoke (Y2 bulgusu)
-- ═══════════════════════════════════════════════════════════════
-- Postgres, yeni bir fonksiyon oluşturulunca varsayılan olarak PUBLIC
-- role'üne (yani "herkese") execute izni verir — bu migration'a kadar
-- HİÇBİR admin/RPC fonksiyonu bunu açıkça revoke etmemişti; sadece
-- `grant ... to authenticated` ile "ekleniyordu", taban PUBLIC izni hiç
-- kaldırılmamıştı. Bu, PostgREST/Supabase istemcisi (anon/authenticated
-- rolleriyle sınırlı) üzerinden doğrudan istismar edilebilir bir açık
-- DEĞİL (PostgREST zaten sadece anon/authenticated olarak bağlanır) ama
-- veritabanına başka bir yoldan (örn. connection pooler, farklı bir rol)
-- bağlanan biri için gereksiz bir varsayılan izin — savunma amaçlı revoke
-- edilir. Explicit `grant ... to authenticated/anon` satırları BU
-- migration'dan ETKİLENMEZ (ayrı, kalıcı izinler), sadece implicit PUBLIC
-- izni kaldırılıyor.
--
-- BİLİNÇLİ SINIR: current_school_id(), schools/school_users/settings
-- tabloları bu repodaki migration'larda TANIMLI DEĞİL (Supabase Dashboard'dan
-- elle oluşturulmuş, bkz. PHASE_REPORT.md Faz 8 notu) — bu yüzden
-- current_school_id()'nin PUBLIC izni BURADA DOKUNULMUYOR (yanlış
-- signature'la revoke denemek hataya, hatta yanlış fonksiyonu hedeflemek
-- TÜM UYGULAMANIN RLS'ini bozmaya yol açabilirdi). Kullanıcının bunu
-- Supabase SQL Editor'de elle doğrulaması gerekiyor:
--   select p.proname, p.proacl from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'current_school_id';

revoke execute on function public.register_school(text, text, text, text) from public;
revoke execute on function public.platform_is_admin() from public;
revoke execute on function public.platform_list_schools() from public;
revoke execute on function public.platform_extend_trial(uuid, int, text) from public;
revoke execute on function public.platform_set_subscription(uuid, text, text, timestamptz, timestamptz, text) from public;
revoke execute on function public.platform_freeze_school(uuid, text) from public;
revoke execute on function public.platform_list_enterprise_leads() from public;
revoke execute on function public.platform_list_purchase_intents() from public;
revoke execute on function public.increment_free_generation_usage() from public;
revoke execute on function public.log_schedule_generation(int, int, int, int, int, int) from public;
revoke execute on function public.create_schedule_share(date, date) from public;
revoke execute on function public.get_public_schedule(text) from public;
revoke execute on function public.platform_require_admin() from public;
revoke execute on function public.platform_require_owner() from public;
revoke execute on function public.platform_grant_admin(text, text) from public;
revoke execute on function public.platform_revoke_admin(uuid) from public;
revoke execute on function public.platform_write_audit_log(text, text, uuid, uuid, jsonb, jsonb, text) from public;
revoke execute on function public.platform_list_audit_logs(int, uuid) from public;
revoke execute on function public.platform_list_schools_page(text, text, text, text, text, text, int, int) from public;
revoke execute on function public.platform_add_school_note(uuid, text) from public;
revoke execute on function public.platform_get_school_detail(uuid) from public;
revoke execute on function public.platform_list_admins() from public;
revoke execute on function public.platform_reopen_school(uuid, text) from public;
revoke execute on function public.platform_cancel_subscription(uuid, text) from public;
revoke execute on function public.platform_adjust_free_quota(uuid, int, text) from public;
revoke execute on function public.platform_record_payment(uuid, numeric, text, text, text) from public;
revoke execute on function public.platform_list_payments(uuid, int) from public;
revoke execute on function public.check_rate_limit(text, int, int) from public;
revoke execute on function public.log_security_event(text, jsonb) from public;
revoke execute on function public.platform_list_system_events(int) from public;
revoke execute on function public.platform_generation_success_rate() from public;
