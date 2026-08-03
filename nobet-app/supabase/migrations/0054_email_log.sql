-- ═══════════════════════════════════════════════════════════════
-- E-POSTA TESLİM/DOĞRULAMA TAKİBİ — email_log + email_log_events
-- ═══════════════════════════════════════════════════════════════
-- Süper admin "Email Merkezi" ekranı için: her doğrulama/şifre-sıfırlama
-- mailinin durumunu (gönderildi/teslim/açıldı/tıklandı/bounce/spam/
-- doğrulandı) izler.
--
-- MİMARİ NEDEN (önemli, aksi halde koddaki korelasyon mantığı anlamsız
-- görünür): Supabase Auth (GoTrue) e-postaları SMTP üzerinden Resend'e
-- gönderiyor (bkz. supabase/config.toml [auth.email.smtp]) — bu bizim
-- Next.js kodumuzun DOĞRUDAN çağırdığı bir Resend API isteği DEĞİL.
-- Yani GoTrue'nun ürettiği Resend "email_id"sini uygulama kodumuz asla
-- görmüyor. İki taraf ayrı zamanlarda, ayrı kanallardan yazıyor:
--   1) Uygulama kodu (signUp/resend/resetPasswordForEmail çağrılınca)
--      SADECE "gönderim istendi" bilgisini biliyor → email_log'a
--      provider_message_id'SİZ bir "pending" satır ekler (log_email_pending).
--   2) Resend webhook'u (email.sent) az sonra "alıcı + konu + zaman" ile
--      gelir, provider_message_id'yi TAŞIR → record_email_event bunu en
--      yakın eşleşmeyen pending satıra "evlat edindirir" (adopt). Sonraki
--      tüm olaylar artık provider_message_id ile net eşleşir.
-- Bu, Supabase+SMTP+Resend üçlüsünde başka türlü mümkün olmayan tek
-- korelasyon yolu — kendi token/id sistemi İCAT EDİLMEDİ, sadece var
-- olan (alıcı, tür, zaman penceresi) bilgisiyle eşleştirme yapılıyor.

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  email text not null,
  mail_type text not null check (mail_type in ('confirmation', 'recovery')),
  provider text not null default 'resend',
  provider_message_id text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  delayed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  -- verified_at Resend'den GELMEZ — kodun kendisi (verifyOtp() başarılı
  -- olunca) mark_email_verified() ile yazar. "Doğrulandı" bizim ürün
  -- seviyemizde bir gerçek, Resend'in hiç bilmediği bir olay.
  verified_at timestamptz,
  last_event_at timestamptz
);
alter table public.email_log enable row level security;
revoke all on public.email_log from authenticated, anon;

-- BİLİNÇLİ SINIR: ayrı, indexlenmiş bir "status" sütunu YOK (CLAUDE.md
-- sadelik kuralı — iki çözüm aynı sonucu veriyorsa basit olan seçilir).
-- Durum, timestamp sütunlarından CASE ile TÜRETİLİYOR (aşağıdaki RPC'lerde)
-- — bir trigger'la senkron tutulan ayrı bir enum sütunu, bu ürünün gerçek
-- hacminde (yüzlerce/binlerce kayıt, "100.000" senaryosu bile Postgres için
-- küçük) ölçülebilir bir kazanç sağlamaz, sadece senkronizasyon riski
-- ekler. created_at/mail_type/school_id/user_id/email üzerindeki index'ler
-- filtreleri zaten daraltıyor, CASE ifadesi kalan az sayıda satırda çalışır.
create index if not exists idx_email_log_created_at on public.email_log(created_at desc);
create index if not exists idx_email_log_school_id on public.email_log(school_id);
create index if not exists idx_email_log_user_id on public.email_log(user_id);
create index if not exists idx_email_log_email on public.email_log(email);
create index if not exists idx_email_log_mail_type on public.email_log(mail_type);
create index if not exists idx_email_log_provider_message_id on public.email_log(provider, provider_message_id) where provider_message_id is not null;
-- record_email_event()'in "en yakın eşleşmeyen pending satır" aramasının
-- kullandığı index — provider_message_id NULL olan satırlar (henüz ilk
-- webhook'u almamış) için email+tür+zaman sıralı.
create index if not exists idx_email_log_pending_lookup on public.email_log(email, mail_type, created_at desc) where provider_message_id is null;

-- ── email_log_events — HAM webhook olay geçmişi (immutable, audit) ──
-- email_log satırdaki sütunlar "şu anki durum"u tutar; bu tablo HER
-- olayı (tekrarları/sırası dahil) ham haliyle saklar — adli inceleme +
-- "her mail için ID/Provider/Message ID/Provider Event ID/Status/
-- Timestamp" gereksinimini karşılar. email_log_id NULL olabilir:
-- korelasyon başarısız olursa (bkz. record_email_event) olay yine de
-- kaybolmasın diye "yetim" olarak saklanır.
create table if not exists public.email_log_events (
  id uuid primary key default gen_random_uuid(),
  email_log_id uuid references public.email_log(id) on delete cascade,
  provider text not null default 'resend',
  provider_event_id text,
  provider_message_id text,
  event_type text not null,
  occurred_at timestamptz not null,
  raw_payload jsonb not null,
  received_at timestamptz not null default now()
);
alter table public.email_log_events enable row level security;
revoke all on public.email_log_events from authenticated, anon;

create index if not exists idx_email_log_events_log_id on public.email_log_events(email_log_id);
-- İdempotency: Resend/Svix webhook teslimi "at-least-once" — aynı olay
-- tekrar gelebilir. provider_event_id (svix-id) üzerinde unique index,
-- record_email_event()'in aynı olayı iki kez işlemesini engeller.
create unique index if not exists idx_email_log_events_dedup on public.email_log_events(provider, provider_event_id) where provider_event_id is not null;

-- ═══════════════════════════════════════════════════════════════
-- log_email_pending — uygulama kodu (signup/forgot-password action'ları)
-- signUp()/resend()/resetPasswordForEmail() çağrısı BAŞARILI dönünce
-- çağırır. anon'a da açık: signup ve şifre sıfırlama pre-auth akışlar.
-- ═══════════════════════════════════════════════════════════════
create or replace function public.log_email_pending(
  p_email text,
  p_mail_type text,
  p_ip text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_school_id uuid;
  v_id uuid;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'Geçersiz e-posta.';
  end if;
  if p_mail_type not in ('confirmation', 'recovery') then
    raise exception 'Geçersiz mail türü.';
  end if;

  -- user_id/school_id İSTEMCİDEN alınmıyor, DB içinde e-postadan çözülüyor
  -- — hem daha güvenli (çağıran keyfi bir user_id iddia edemez) hem de
  -- forgot-password akışı için tek kod yolu (resetPasswordForEmail hangi
  -- kullanıcıya ait olduğunu asla dışa sızdırmaz, ama bu fonksiyon
  -- İÇERİDE, sonuç döndürmeden, eşleştirebilir).
  select u.id into v_user_id from auth.users u where lower(u.email) = lower(p_email) limit 1;
  if v_user_id is not null then
    select su.school_id into v_school_id from school_users su where su.user_id = v_user_id order by su.created_at asc limit 1;
  end if;

  insert into email_log (user_id, school_id, email, mail_type, ip, user_agent)
  values (v_user_id, v_school_id, lower(p_email), p_mail_type, p_ip, p_user_agent)
  returning id into v_id;

  return v_id;
end;
$$;
grant execute on function public.log_email_pending(text, text, text, text) to authenticated, anon;

-- ═══════════════════════════════════════════════════════════════
-- mark_email_verified — verifyOtp() (signup) veya şifre güncelleme
-- (recovery) BAŞARILI olunca, o session'ın sahibi kendi kaydını işaretler.
-- user_id = auth.uid() şartı yetki kontrolü YERİNE GEÇER — başka bir
-- kullanıcının log satırı işaretlenemez, ayrı bir "sahiplik" fonksiyonu
-- gerekmedi.
-- ═══════════════════════════════════════════════════════════════
create or replace function public.mark_email_verified(p_email text, p_mail_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Giriş yapılmamış.';
  end if;
  if p_mail_type not in ('confirmation', 'recovery') then
    raise exception 'Geçersiz mail türü.';
  end if;

  update email_log
  set verified_at = now(), last_event_at = now()
  where id = (
    select id from email_log
    where lower(email) = lower(p_email) and mail_type = p_mail_type and user_id = auth.uid() and verified_at is null
    order by created_at desc limit 1
  );
end;
$$;
grant execute on function public.mark_email_verified(text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- record_email_event — SADECE webhook route'u (service-role client,
-- bkz. lib/supabase/admin.js + app/api/webhooks/resend/route.js) çağırır.
-- authenticated/anon'dan AÇIKÇA REVOKE edildi — sahte "delivered"/
-- "verified" olayı enjekte edilemesin diye (webhook route zaten Svix
-- imzasını doğruluyor, bu fonksiyon o doğrulamadan SONRAKİ adım).
-- ═══════════════════════════════════════════════════════════════
create or replace function public.record_email_event(
  p_provider text,
  p_provider_event_id text,
  p_provider_message_id text,
  p_to_email text,
  p_mail_type_hint text,
  p_event_type text,
  p_occurred_at timestamptz,
  p_raw_payload jsonb,
  p_failure_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
begin
  if p_provider_event_id is not null and exists (
    select 1 from email_log_events where provider = p_provider and provider_event_id = p_provider_event_id
  ) then
    return; -- zaten işlenmiş (at-least-once teslim tekrarı)
  end if;

  if p_provider_message_id is not null then
    select id into v_log_id from email_log
    where provider = p_provider and provider_message_id = p_provider_message_id
    limit 1;
  end if;

  if v_log_id is null and p_to_email is not null and p_mail_type_hint is not null then
    select id into v_log_id from email_log
    where lower(email) = lower(p_to_email)
      and mail_type = p_mail_type_hint
      and provider_message_id is null
      and created_at > now() - interval '15 minutes'
    order by created_at desc
    limit 1;

    if v_log_id is not null and p_provider_message_id is not null then
      update email_log set provider_message_id = p_provider_message_id where id = v_log_id;
    end if;
  end if;

  if v_log_id is not null then
    update email_log set
      sent_at = case when p_event_type = 'email.sent' then p_occurred_at else sent_at end,
      delivered_at = case when p_event_type = 'email.delivered' then p_occurred_at else delivered_at end,
      opened_at = case when p_event_type = 'email.opened' then p_occurred_at else opened_at end,
      clicked_at = case when p_event_type = 'email.clicked' then p_occurred_at else clicked_at end,
      bounced_at = case when p_event_type = 'email.bounced' then p_occurred_at else bounced_at end,
      complained_at = case when p_event_type = 'email.complained' then p_occurred_at else complained_at end,
      delayed_at = case when p_event_type = 'email.delivery_delayed' then p_occurred_at else delayed_at end,
      failed_at = case when p_event_type = 'email.failed' then p_occurred_at else failed_at end,
      failure_reason = coalesce(p_failure_reason, failure_reason),
      last_event_at = p_occurred_at
    where id = v_log_id;
  end if;

  -- v_log_id NULL olsa bile (korelasyon başarısız — "yetim" olay) ham
  -- olay burada saklanır, kaybolmaz.
  insert into email_log_events (email_log_id, provider, provider_event_id, provider_message_id, event_type, occurred_at, raw_payload)
  values (v_log_id, p_provider, p_provider_event_id, p_provider_message_id, p_event_type, p_occurred_at, p_raw_payload);
end;
$$;
revoke all on function public.record_email_event(text, text, text, text, text, text, timestamptz, jsonb, text) from public, authenticated, anon;

-- ═══════════════════════════════════════════════════════════════
-- SÜPER ADMİN — Email Merkezi: sayfalanmış liste + istatistikler + resend audit
-- ═══════════════════════════════════════════════════════════════
create or replace function public.platform_list_email_log_page(
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_school_id uuid default null,
  p_user_id uuid default null,
  p_mail_type text default null,
  p_status text default null,
  p_search text default null,
  p_page int default 1,
  p_page_size int default 25
)
returns table (
  id uuid,
  user_id uuid,
  school_id uuid,
  school_name text,
  full_name text,
  email text,
  mail_type text,
  status text,
  provider text,
  provider_message_id text,
  ip text,
  user_agent text,
  created_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  delayed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  verified_at timestamptz,
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

  if p_mail_type is not null and p_mail_type not in ('confirmation', 'recovery') then
    raise exception 'Geçersiz mail türü.';
  end if;
  if p_status is not null and p_status not in ('pending', 'sent', 'delivered', 'opened', 'clicked', 'verified', 'bounced', 'complained', 'delayed', 'failed') then
    raise exception 'Geçersiz durum filtresi.';
  end if;
  if p_search is not null and length(p_search) > 200 then
    raise exception 'Arama terimi çok uzun.';
  end if;

  return query
  select
    e.id, e.user_id, e.school_id, s.name, coalesce(u.raw_user_meta_data ->> 'full_name', ''),
    e.email, e.mail_type,
    -- Öncelik: negatif/terminal sinyaller (spam/bounce/fail) her zaman
    -- kazanır (operasyonel olarak en kritik), sonra bizim "verified"
    -- gerçeğimiz, sonra Resend'in pozitif ilerleme sinyalleri.
    case
      when e.complained_at is not null then 'complained'
      when e.bounced_at is not null then 'bounced'
      when e.failed_at is not null then 'failed'
      when e.verified_at is not null then 'verified'
      when e.clicked_at is not null then 'clicked'
      when e.opened_at is not null then 'opened'
      when e.delivered_at is not null then 'delivered'
      when e.delayed_at is not null then 'delayed'
      when e.sent_at is not null then 'sent'
      else 'pending'
    end,
    e.provider, e.provider_message_id, e.ip, e.user_agent, e.created_at,
    e.sent_at, e.delivered_at, e.opened_at, e.clicked_at, e.bounced_at,
    e.complained_at, e.delayed_at, e.failed_at, e.failure_reason, e.verified_at,
    count(*) over()::bigint
  from email_log e
  left join schools s on s.id = e.school_id
  left join auth.users u on u.id = e.user_id
  where (p_date_from is null or e.created_at >= p_date_from)
    and (p_date_to is null or e.created_at <= p_date_to)
    and (p_school_id is null or e.school_id = p_school_id)
    and (p_user_id is null or e.user_id = p_user_id)
    and (p_mail_type is null or e.mail_type = p_mail_type)
    and (p_search is null or e.email ilike '%' || p_search || '%' or s.name ilike '%' || p_search || '%')
    and (p_status is null or (
      case
        when e.complained_at is not null then 'complained'
        when e.bounced_at is not null then 'bounced'
        when e.failed_at is not null then 'failed'
        when e.verified_at is not null then 'verified'
        when e.clicked_at is not null then 'clicked'
        when e.opened_at is not null then 'opened'
        when e.delivered_at is not null then 'delivered'
        when e.delayed_at is not null then 'delayed'
        when e.sent_at is not null then 'sent'
        else 'pending'
      end
    ) = p_status)
  order by e.created_at desc
  limit v_page_size offset v_offset;
end;
$$;
revoke all on function public.platform_list_email_log_page(timestamptz, timestamptz, uuid, uuid, text, text, text, int, int) from public;
grant execute on function public.platform_list_email_log_page(timestamptz, timestamptz, uuid, uuid, text, text, text, int, int) to authenticated;

-- İstatistikler — SADECE ölçülebilen metrikler. "Open Rate" notu: Resend
-- açılma takibi domain ayarında etkinse gelir; hiç açılma yoksa bunun
-- "takip kapalı" mı yoksa "gerçekten hiç açılmadı" mı olduğunu bu sayı
-- TEK BAŞINA ayırt edemez (Email Merkezi arayüzünde bu net belirtiliyor).
create or replace function public.platform_email_log_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today timestamptz := date_trunc('day', now());
  v_sent_today int;
  v_sent int;
  v_delivered int;
  v_failed int;
  v_bounced int;
  v_opened int;
  v_confirmation_total int;
  v_confirmation_verified int;
  v_recovery_total int;
  v_recovery_verified int;
begin
  perform platform_require_admin();

  select count(*) into v_sent_today from email_log where created_at >= v_today;

  select
    count(*) filter (where sent_at is not null or delivered_at is not null or opened_at is not null or clicked_at is not null),
    count(*) filter (where delivered_at is not null),
    count(*) filter (where failed_at is not null or bounced_at is not null),
    count(*) filter (where bounced_at is not null),
    count(*) filter (where opened_at is not null)
    into v_sent, v_delivered, v_failed, v_bounced, v_opened
    from email_log where created_at >= v_today;

  select count(*), count(*) filter (where verified_at is not null) into v_confirmation_total, v_confirmation_verified
    from email_log where mail_type = 'confirmation' and created_at >= v_today;
  select count(*), count(*) filter (where verified_at is not null) into v_recovery_total, v_recovery_verified
    from email_log where mail_type = 'recovery' and created_at >= v_today;

  return jsonb_build_object(
    'sent_today', v_sent_today,
    'delivered_today', v_delivered,
    'failed_today', v_failed,
    'bounced_today', v_bounced,
    'delivery_rate', case when v_sent > 0 then round((v_delivered::numeric / v_sent) * 100, 1) else null end,
    'open_rate', case when v_delivered > 0 then round((v_opened::numeric / v_delivered) * 100, 1) else null end,
    'verification_rate', case when v_confirmation_total > 0 then round((v_confirmation_verified::numeric / v_confirmation_total) * 100, 1) else null end,
    'reset_rate', case when v_recovery_total > 0 then round((v_recovery_verified::numeric / v_recovery_total) * 100, 1) else null end
  );
end;
$$;
revoke all on function public.platform_email_log_stats() from public;
grant execute on function public.platform_email_log_stats() to authenticated;

-- Manuel "tekrar gönder" işlemini denetim izine yazar — asıl gönderim
-- Supabase Auth API'sinin kendisi (app/super-admin/actions/emailLog.js),
-- bu fonksiyon SADECE audit kaydı (bkz. platform_write_audit_log,
-- 0022_admin_audit_log.sql — doğrudan authenticated'a açık değil, sadece
-- başka security definer fonksiyonlardan çağrılabiliyor).
create or replace function public.platform_log_email_resend(p_email text, p_mail_type text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();
  if p_mail_type not in ('confirmation', 'recovery') then
    raise exception 'Geçersiz mail türü.';
  end if;
  perform platform_write_audit_log('email.manual_resend', 'email_log', null, null, null, jsonb_build_object('email', p_email, 'mail_type', p_mail_type), p_reason);
end;
$$;
revoke all on function public.platform_log_email_resend(text, text, text) from public;
grant execute on function public.platform_log_email_resend(text, text, text) to authenticated;
