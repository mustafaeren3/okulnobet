-- 0011, "schools" tablosunda UPDATE'i BİLEREK sadece rotation_mode
-- sütununa açmıştı ("okul adı/il/ilçe hâlâ istemciden değiştirilemez").
-- Okul müdürü/müdür yardımcısı adı artık `profile` jsonb sütununda
-- tutuluyor (bkz. lib/db/schoolContext.js updateSchoolProfileFields) —
-- aynı satır-bazlı RLS
-- politikası (schools_update_own_school, 0011) zaten var, sadece bu
-- sütuna da sütun-bazlı grant açmak yeterli.

grant update (profile) on public.schools to authenticated;
