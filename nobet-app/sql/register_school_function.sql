-- ═══════════════════════════════════════════════════════════════
-- GÜVENLİ OKUL KAYIT FONKSİYONU (register_school)
-- ═══════════════════════════════════════════════════════════════
-- Bu dosyayı Supabase SQL Editor'de çalıştır. Mevcut tabloları
-- yeniden oluşturmaz, sadece yeni bir fonksiyon ekler — güvenle
-- tekrar tekrar çalıştırılabilir (create or replace).
--
-- NEDEN GEREKLİ?
-- schools / school_users tablolarına düz bir "insert" RLS politikası
-- açarsak, kötü niyetli bir kullanıcı var olan bir okulun id'sini
-- bulup kendini o okula "admin" olarak ekleyebilir. Bunun yerine
-- SECURITY DEFINER fonksiyonu kullanıyoruz: fonksiyonun içindeki
-- mantık her zaman "yeni bir okul oluştur + SADECE kendini bağla"
-- şeklinde sabit, kullanıcı bu mantığı değiştiremez.

create or replace function public.register_school(
  p_name text,
  p_city text,
  p_district text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_school_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapılmamış kullanıcı okul oluşturamaz';
  end if;

  -- Bu kullanıcı zaten bir okula bağlıysa tekrar okul oluşturmasın
  if exists (select 1 from school_users where user_id = auth.uid()) then
    raise exception 'Bu kullanıcı zaten bir okula bağlı';
  end if;

  insert into schools (name, city, district)
  values (p_name, p_city, p_district)
  returning id into new_school_id;

  insert into school_users (user_id, school_id, role)
  values (auth.uid(), new_school_id, 'admin');

  insert into settings (school_id, start_date, end_date)
  values (new_school_id, '2026-09-14', '2027-06-25');

  return new_school_id;
end;
$$;

-- Sadece giriş yapmış (authenticated) kullanıcılar bu fonksiyonu çağırabilir
grant execute on function public.register_school(text, text, text) to authenticated;
