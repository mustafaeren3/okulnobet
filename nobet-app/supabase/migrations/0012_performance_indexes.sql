-- ═══════════════════════════════════════════════════════════════
-- PERFORMANS: eksik indexler
-- ═══════════════════════════════════════════════════════════════
-- Kullanıcı raporu: öğretmen silme 4-5 saniye sürüyor. Kök neden:
-- Postgres foreign key sütunlarını OTOMATİK indexlemez — school_id/
-- teacher_id/zone_id üzerinde unique kısıt OLMAYAN tablolarda hiç index
-- yoktu. Sonuç: (a) her RLS kontrolü (school_id = current_school_id())
-- sequential scan'e düşüyordu, (b) bir öğretmeni silerken cascade'in
-- ilgili satırları bulması (örn. exceptions.teacher_id) tam tablo
-- taraması gerektiriyordu. Site artık gerçek kullanıcılara açılacağı
-- için bu satır sayısı arttıkça sorun daha da büyüyecekti.
--
-- Zaten indexli olanlar (unique kısıt sütunu leading olduğu için)
-- BURADA TEKRARLANMADI: teachers/duty_zones'un school_id'si hariç
-- hemen hemen her şey bir unique(school_id, ...) veya unique(teacher_id, ...)
-- ile örtük indexliydi — teachers, duty_zones, duty_assignments.school_id,
-- duty_assignments.zone_id, zone_closures, exceptions ve school_users.user_id
-- bunun İSTİSNASIYDI (hiç indexi yoktu).

create index if not exists idx_teachers_school_id on public.teachers(school_id);
create index if not exists idx_duty_zones_school_id on public.duty_zones(school_id);

create index if not exists idx_duty_assignments_school_id on public.duty_assignments(school_id);
create index if not exists idx_duty_assignments_zone_id on public.duty_assignments(zone_id);

create index if not exists idx_zone_closures_school_id on public.zone_closures(school_id);
create index if not exists idx_zone_closures_zone_id on public.zone_closures(zone_id);

create index if not exists idx_rules_school_id on public.rules(school_id);

create index if not exists idx_exceptions_school_id on public.exceptions(school_id);
create index if not exists idx_exceptions_teacher_id on public.exceptions(teacher_id);

-- school_users: her sunucu isteğinde requireSchoolId/getSchoolForUser
-- BU tabloyu user_id ile sorguluyor (bkz. lib/db/schoolContext.js) —
-- tabanı şeması repo dışında kurulduğu için (bkz. 0003'ün notu) burada
-- ayrıca garanti altına alınıyor.
create index if not exists idx_school_users_user_id on public.school_users(user_id);
