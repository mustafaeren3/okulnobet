-- ═══════════════════════════════════════════════════════════════
-- PERFORMANS: Görevli Müdür Yardımcısı tablolarında eksik index'ler
-- ═══════════════════════════════════════════════════════════════
-- Kalite denetimi bulgusu: 0012_performance_indexes.sql'in kendi kaydı,
-- FK sütunlarında index olmayan tablolarda ("Postgres FK sütunlarını
-- OTOMATİK indexlemez") gerçek bir production yavaşlığına (öğretmen silme
-- 4-5 saniye) yol açtığını belgeliyor. Aynı hata yeni tablolarda tekrarlandı:
--
-- - assistant_principals.school_id: index YOK (teachers.school_id'nin
--   0012'de tam bu yüzden indexlendiği durumun birebir eşi — her RLS
--   kontrolü ve okul bazlı listeleme sequential scan'e düşer).
-- - assistant_principal_assignments.assistant_principal_id: index YOK
--   (duty_assignments.zone_id'nin 0012'de tam bu yüzden indexlendiği
--   durumun birebir eşi — bir kişi silinince cascade delete'in ilgili
--   atama satırlarını bulması tam tablo taraması gerektirir).
--
-- assistant_principal_rotation_settings.school_id VE
-- assistant_principal_assignments.school_id TEKRAR İNDEXLENMİYOR — ikisi
-- de zaten bir PK/UNIQUE kısıtının ÖNCÜ sütunu (0038: primary key
-- (school_id, role_key); 0039: unique (school_id, duty_date)), örtük
-- index yeterli (0012'nin kendi yorumundaki aynı istisna).

create index if not exists idx_assistant_principals_school_id
  on public.assistant_principals(school_id);

create index if not exists idx_assistant_principal_assignments_person_id
  on public.assistant_principal_assignments(assistant_principal_id);
