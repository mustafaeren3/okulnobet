-- ═══════════════════════════════════════════════════════════════
-- KAYIT AKIŞI v2 — telefon kaldırıldı, okul türü eklendi
-- ═══════════════════════════════════════════════════════════════
-- Kullanıcı kararı: kayıt formundan telefon alanı tamamen kalkıyor,
-- yerine "okul türü" ekleniyor. İki değişiklik:
--
-- 1) schools.school_type CHECK kısıtı genişletildi — 0003'teki 8 kaba
--    kategori yerine artık lib/data/schoolTypes.js (mebSchoolLookup.js'in
--    de kullandığı) 16 değerlik sözlükle BİREBİR aynı. Böylece kayıt
--    formundaki "Okul Türü" seçimi doğrudan bu sütuna yazılabiliyor —
--    ayrı bir eşleme tablosu gerekmiyor.
--
-- 2) register_school: p_phone parametresi kaldırıldı, p_school_type
--    eklendi. Deneme/kötüye kullanım engeli (trial_registrations) artık
--    SADECE e-postaya bakıyor — e-posta zaten OTP ile doğrulanıyor, tek
--    başına anlamlı bir engel. trial_registrations.phone NOT NULL
--    kaldırıldı (geçmiş satırlar KORUNUYOR, sadece yeni satırlar NULL
--    geçebilir) — sütun silinmedi, geçmiş denetim izi kaybolmasın diye.

alter table public.schools drop constraint if exists schools_school_type_check;
alter table public.schools add constraint schools_school_type_check
  check (school_type in (
    'ilkokul','ortaokul','imam_hatip_ortaokulu','lise','anadolu_lisesi',
    'fen_lisesi','sosyal_bilimler_lisesi','imam_hatip_lisesi',
    'mesleki_teknik_lise','guzel_sanatlar_lisesi','spor_lisesi','anaokulu',
    'ozel_egitim','halk_egitim','diger_kurum','diger'
  ));

alter table public.trial_registrations alter column phone drop not null;

-- İmza değişti (p_phone çıktı, p_school_type girdi) — eski 4 parametreli
-- sürüm önce düşürülüyor, yoksa Postgres iki ayrı fonksiyon (overload)
-- olarak ikisini de tutar ve eski, telefon isteyen sürüm çağrılabilir kalır.
drop function if exists public.register_school(text, text, text, text);

create or replace function public.register_school(
  p_name text,
  p_city text,
  p_district text,
  p_school_type text
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

  select email into v_email from auth.users where id = auth.uid();

  if exists (select 1 from trial_registrations where lower(email) = lower(v_email)) then
    raise exception 'Bu e-posta adresiyle daha önce bir hesap oluşturulmuş. Devam etmek için abonelik satın almanız gerekiyor.';
  end if;

  insert into schools (name, city, district, school_type)
  values (p_name, p_city, p_district, p_school_type)
  returning id into new_school_id;

  insert into school_users (user_id, school_id, role)
  values (auth.uid(), new_school_id, 'admin');

  insert into settings (school_id, start_date, end_date)
  values (new_school_id, '2026-09-14', '2027-06-25');

  insert into subscriptions (school_id, plan_type, status)
  values (new_school_id, 'free', 'active');

  insert into trial_registrations (email, phone, school_id)
  values (v_email, null, new_school_id);

  return new_school_id;
end;
$$;

revoke all on function public.register_school(text, text, text, text) from public;
grant execute on function public.register_school(text, text, text, text) to authenticated;
