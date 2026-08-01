-- ═══════════════════════════════════════════════════════════════
-- SÜPER ADMIN İÇİN SINIRSIZ TEST — MERKEZİ POLİTİKA (DB TARAFI)
-- ═══════════════════════════════════════════════════════════════
-- Uygulama tarafındaki asıl muafiyet lib/engine/policy.js +
-- lib/db/subscriptions.js:getSubscriptionForSchool() içinde (bkz. o
-- dosyadaki yorum) — abonelik/kota/özellik kısıtlarının TAMAMI oradan
-- geçtiği için TEK noktadan çözülüyor. Burada sadece register_school'daki
-- "bir e-posta sadece bir hesap açabilir" (trial_registrations) kısıtını
-- platform_admins üyeleri için atlıyoruz — süper admin kendi e-postasıyla
-- birden fazla test okulu açabilsin diye (aksi halde ikinci "Kaydol"
-- denemesinde "zaten bir hesap var" hatası alırdı).
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
  v_is_platform_admin boolean;
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
  v_is_platform_admin := platform_is_admin();

  if not v_is_platform_admin and exists (
    select 1 from trial_registrations where lower(email) = lower(v_email)
  ) then
    raise exception 'Bu e-posta adresiyle daha önce bir hesap oluşturulmuş. Devam etmek için abonelik satın almanız gerekiyor.';
  end if;

  insert into schools (name, city, district, school_type)
  values (p_name, p_city, p_district, p_school_type)
  returning id into new_school_id;

  insert into school_users (user_id, school_id, role)
  values (auth.uid(), new_school_id, 'admin');

  insert into settings (school_id, start_date, end_date)
  values (new_school_id, '2026-09-14', '2027-06-25');

  -- Süper admin'in test okulları da subscriptions satırı alır (RLS/join'lerin
  -- beklediği satır var olsun diye) — gerçek plan_type/status önemli değil,
  -- getSubscriptionForSchool() bunu zaten sınırsız overlay ile geçersiz kılıyor.
  insert into subscriptions (school_id, plan_type, status)
  values (new_school_id, 'free', 'active');

  if not v_is_platform_admin then
    insert into trial_registrations (email, phone, school_id)
    values (v_email, null, new_school_id);
  end if;

  return new_school_id;
end;
$$;

revoke all on function public.register_school(text, text, text, text) from public;
grant execute on function public.register_school(text, text, text, text) to authenticated;
