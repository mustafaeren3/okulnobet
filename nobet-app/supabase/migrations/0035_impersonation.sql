-- ═══════════════════════════════════════════════════════════════
-- IMPERSONATION ("Kullanıcı olarak giriş yap")
-- ═══════════════════════════════════════════════════════════════
-- ÖNEMLİ MİMARİ NOT: Bu GERÇEK bir oturum/kimlik değişimi DEĞİL —
-- hedef kullanıcının şifresi bilinmeden bir Supabase Auth oturumu
-- ÜRETMEK service_role key gerektirir, bu depoda YOK (bkz. önceki
-- fazlardaki "kullanıcı silme" notu — aynı kısıt burada da geçerli).
-- Bunun yerine admin KENDİ oturumuyla (kendi auth.uid()'i, kendi aal2
-- MFA'sıyla) kalır; sadece current_school_id()'nin dönüşü, admin
-- AKTİF bir impersonation başlattıysa hedef okula işaret eder. Bu,
-- gerçek session-swap'ten DAHA GÜVENLİ: hedef kullanıcının kimliği
-- hiçbir zaman taklit edilmiyor/token üretilmiyor, her şey admin'in
-- kendi denetlenebilir oturumu üzerinden yürüyor.
--
-- YENİ TABLO GEREKÇESİ: impersonation_sessions — "şu an aktif bir
-- impersonation var mı" sorgusu (current_school_id() içinde, HER
-- istekte çalışır) ile "kim ne zaman kime geçti/çıktı" denetim izi
-- AYNI satır şeklinde doğal olarak örtüşüyor (started_at + ended_at
-- null/dolu = aktif/bitmiş). Ayrı bir "audit log" + ayrı bir "aktif
-- oturum" tablosu tutmak veriyi ikiye bölerdi.
--
-- KOD TEKRARI YOK: limit/kota/trial/premium/feature-gate muafiyeti
-- YENİDEN yazılmıyor — lib/engine/policy.js:applyUnlimitedOverlay()
-- ve onu tetikleyen lib/db/subscriptions.js:getSubscriptionForSchool()
-- ZATEN var (platform_is_admin() true ise otomatik uygulanıyor).
-- Bunlar bugüne kadar hiç TETİKLENEMİYORDU çünkü admin'in bağlı
-- olduğu bir school_id hiç yoktu (school_users'ta satırı yok).
-- Impersonation, TEK EKSİK olan "hangi okul" bağlamını sağlıyor —
-- current_school_id() düzeldiği anda var olan tüm merkezi muafiyet
-- sistemi otomatik devreye giriyor, hiçbir yeni "if (owner)" gerekmedi.

create table if not exists public.impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  target_school_id uuid not null references public.schools(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  reason text
);
create index if not exists idx_impersonation_active on public.impersonation_sessions(admin_user_id) where ended_at is null;

alter table public.impersonation_sessions enable row level security;
revoke all on public.impersonation_sessions from authenticated, anon;
create policy "impersonation_sessions_admin_all" on public.impersonation_sessions for all
  using (platform_is_admin_aal2()) with check (platform_is_admin_aal2());
grant select, insert, update on public.impersonation_sessions to authenticated;

-- ── current_school_id(): impersonation'a duyarlı hale getirildi ──────
-- ÖNCEKİ (canlıdan okunan, hiçbir migration'da tanımlı değildi — bu
-- migration onu ilk kez versiyon kontrolüne alıyor):
--   select school_id from school_users where user_id = auth.uid() limit 1;
-- Bu davranış NORMAL kullanıcılar için (school_users'ta satırı olanlar)
-- BİREBİR KORUNUYOR — aşağıdaki fonksiyon aynı sorguyu ÖNCE çalıştırıp
-- doluysa hemen onu döner. Sadece school_users'ta HİÇ satırı olmayan
-- (yani platform_admin adayı) kullanıcılar için, GERÇEKTEN platform_admins
-- üyesiyse VE aktif (2 saatten eski değil — unutulmuş bir oturumun süresiz
-- açık kalmasını engellemek için) bir impersonation'ı varsa, hedef okulu
-- döner. SECURITY DEFINER oldu çünkü platform_admins/impersonation_sessions
-- authenticated'e kapalı (RLS bypass gerekiyor) — normal kullanıcı yolu
-- (school_users sorgusu) zaten kendi satırını okuduğu için bu bypass'tan
-- hiçbir ek bilgiye erişemiyor.
create or replace function public.current_school_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
  v_target uuid;
begin
  select school_id into v_school_id from school_users where user_id = auth.uid() limit 1;
  if v_school_id is not null then
    return v_school_id;
  end if;

  if exists (select 1 from platform_admins where user_id = auth.uid() and revoked_at is null) then
    select target_school_id into v_target
    from impersonation_sessions
    where admin_user_id = auth.uid()
      and ended_at is null
      and started_at > now() - interval '2 hours'
    order by started_at desc
    limit 1;
    return v_target;
  end if;

  return null;
end;
$$;
revoke execute on function public.current_school_id() from public;
grant execute on function public.current_school_id() to authenticated;

-- ── platform_start_impersonation(): tek aktif oturum garantisi ───────
create or replace function public.platform_start_impersonation(p_school_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform platform_require_admin();

  if not exists (select 1 from schools where id = p_school_id) then
    raise exception 'Okul bulunamadı.';
  end if;

  update impersonation_sessions set ended_at = now()
  where admin_user_id = auth.uid() and ended_at is null;

  insert into impersonation_sessions (admin_user_id, target_school_id, reason)
  values (auth.uid(), p_school_id, p_reason);

  perform platform_write_audit_log(
    'impersonation.start', 'school', p_school_id, p_school_id,
    null, jsonb_build_object('admin_user_id', auth.uid()), p_reason
  );
end;
$$;
revoke execute on function public.platform_start_impersonation(uuid, text) from public;
grant execute on function public.platform_start_impersonation(uuid, text) to authenticated;

-- ── platform_end_impersonation() ─────────────────────────────────────
create or replace function public.platform_end_impersonation()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
begin
  perform platform_require_admin();

  select target_school_id into v_school_id
  from impersonation_sessions
  where admin_user_id = auth.uid() and ended_at is null
  order by started_at desc limit 1;

  update impersonation_sessions set ended_at = now()
  where admin_user_id = auth.uid() and ended_at is null;

  if v_school_id is not null then
    perform platform_write_audit_log(
      'impersonation.end', 'school', v_school_id, v_school_id,
      null, jsonb_build_object('admin_user_id', auth.uid()), null
    );
  end if;
end;
$$;
revoke execute on function public.platform_end_impersonation() from public;
grant execute on function public.platform_end_impersonation() to authenticated;

-- ── platform_get_active_impersonation(): banner + getSchoolForUser için ──
-- Admin değilse veya aktif oturumu yoksa BOŞ döner (exception fırlatmaz) —
-- her sayfa yüklemesinde "impersonation var mı?" diye sorulabilsin diye
-- (bkz. lib/db/schoolContext.js), gereksiz try/catch'e gerek kalmasın.
create or replace function public.platform_get_active_impersonation()
returns table (
  target_school_id uuid,
  school_name text,
  owner_email text,
  owner_full_name text,
  started_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from platform_admins where user_id = auth.uid() and revoked_at is null) then
    return;
  end if;

  return query
  select s.id, s.name, owner.email,
    coalesce(owner.raw_user_meta_data ->> 'full_name', ''),
    i.started_at
  from impersonation_sessions i
  join schools s on s.id = i.target_school_id
  left join lateral (
    select u.email, u.raw_user_meta_data
    from school_users su join auth.users u on u.id = su.user_id
    where su.school_id = i.target_school_id
    order by (su.role = 'admin') desc, su.created_at asc
    limit 1
  ) owner on true
  where i.admin_user_id = auth.uid()
    and i.ended_at is null
    and i.started_at > now() - interval '2 hours'
  order by i.started_at desc
  limit 1;
end;
$$;
revoke execute on function public.platform_get_active_impersonation() from public;
grant execute on function public.platform_get_active_impersonation() to authenticated;
