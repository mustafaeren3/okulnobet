-- ═══════════════════════════════════════════════════════════════
-- RATE LIMITING + SİSTEM OLAYLARI — Postgres tabanlı (harici servis yok)
-- ═══════════════════════════════════════════════════════════════
-- Y5 bulgusu: hiçbir yerde rate limiting yoktu. Kullanıcı onayı: harici
-- bir servise (Upstash/Redis) gerek yok — zaten her istek Postgres'e
-- gidiyor, basit bir "son N saniyede kaç deneme" sayacı yeterli.
--
-- BİLİNÇLİ SINIR: rate_limit_events tablosu kendiliğinden temizlenmiyor
-- (pg_cron bu projede kurulu değil, ayrı bir altyapı kararı gerektirir).
-- Zamanla büyür — üretimde periyodik bir temizlik (örn. haftalık "delete
-- where created_at < now() - interval '7 days'") eklenmeli, bu PR'ın
-- kapsamı dışında bırakıldı (bkz. PHASE_REPORT teknik borç).

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  created_at timestamptz not null default now()
);
alter table public.rate_limit_events enable row level security;
revoke all on public.rate_limit_events from authenticated, anon;
create index if not exists idx_rate_limit_events_key_created on public.rate_limit_events(key, created_at desc);

-- check_rate_limit(): her çağrı bir "deneme" kaydeder VE son p_window_seconds
-- içinde p_max_attempts'i aşıp aşmadığını döner. anon'a da açık — login
-- denemesi henüz oturum yokken (pre-auth) olur.
create or replace function public.check_rate_limit(p_key text, p_max_attempts int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_key is null or length(p_key) = 0 then
    raise exception 'Geçersiz rate-limit anahtarı.';
  end if;

  insert into rate_limit_events (key) values (p_key);

  select count(*) into v_count from rate_limit_events
  where key = p_key and created_at > now() - make_interval(secs => p_window_seconds);

  return v_count <= p_max_attempts;
end;
$$;
grant execute on function public.check_rate_limit(text, int, int) to authenticated, anon;

-- ── SYSTEM_EVENTS — güvenlik olayları (başarısız giriş/MFA/rate-limit) ──
create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.system_events enable row level security;
revoke all on public.system_events from authenticated, anon;

-- log_security_event(): anon+authenticated yazabilir (pre-auth
-- olaylar için gerekli) ama SADECE insert — okuma/değiştirme yok.
create or replace function public.log_security_event(p_event_type text, p_detail jsonb default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type is null or length(p_event_type) = 0 then
    raise exception 'Geçersiz olay tipi.';
  end if;
  insert into system_events (event_type, detail) values (p_event_type, p_detail);
end;
$$;
grant execute on function public.log_security_event(text, jsonb) to authenticated, anon;

create or replace function public.platform_list_system_events(p_limit int default 100)
returns setof public.system_events
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  return query select * from system_events order by created_at desc limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;
grant execute on function public.platform_list_system_events(int) to authenticated;

-- ── platform_generation_success_rate(): Genel Bakış'taki "Program
-- Üretme Başarı Oranı" — tek bir GERÇEK sayı (boş kalan yer OLMADAN
-- tamamlanan üretimlerin oranı), fabrikasyon değil. ──────────────────
create or replace function public.platform_generation_success_rate()
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_success int;
begin
  perform platform_require_admin();
  select count(*), count(*) filter (where conflict_count = 0) into v_total, v_success from schedule_generations;
  if v_total = 0 then
    return null;
  end if;
  return round((v_success::numeric / v_total) * 100, 1);
end;
$$;
grant execute on function public.platform_generation_success_rate() to authenticated;
