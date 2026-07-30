-- "Yer kısıtı": bir öğretmen SADECE tek bir nöbet yerinde görevlendirilsin
-- istenebilir (hangi günde görevlendirileceği ayrıca "gün kısıtı" ile
-- sınırlanmadıysa döngüye göre değişebilir). Var olan "gün kısıtı"
-- (restriction_mode + teacher_unavailable_days, 0004/0006) ile aynı
-- mantıkla ama ayrı bir eksende çalışır — ikisi birlikte işaretlenirse
-- öğretmen hem o güne hem o yere sabitlenmiş olur.
--
-- Tek bir nullable FK yeterli (kullanıcının isteği "sadece o yer" — tekil,
-- çoğul bir "izin verilen yerler listesi" istenmedi; junction table YAGNI
-- olurdu). teachers tablosunda zaten tam yetkili update grant'ı var
-- (0004: "grant select, insert, update, delete on public.teachers"),
-- sütun bazlı ayrı bir grant gerekmiyor (schools tablosundaki durumun
-- aksine, bkz. 0011/0014).

alter table public.teachers
  add column if not exists fixed_zone_id uuid references public.duty_zones(id) on delete set null;
