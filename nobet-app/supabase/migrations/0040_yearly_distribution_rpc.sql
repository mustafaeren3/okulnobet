-- ═══════════════════════════════════════════════════════════════
-- YILLIK DAĞILIM — SQL tarafında aggregate (ham satır taşınmaz)
-- ═══════════════════════════════════════════════════════════════
-- Kalite denetimi bulgusu: getAllAssignmentsForSchool() TÜM duty_assignments
-- satırlarını tarih filtresiz çekiyordu — PostgREST'in varsayılan 1000 satır
-- limitine takılıp SESSİZCE eksik veri döndürme riski vardı (birkaç dönem
-- aktif bir okulda kolayca aşılan bir eşik). Çözüm: aggregasyon Postgres'te
-- yapılır, istemciye SADECE (öğretmen × ay) kırılımındaki SAYIMLAR gider —
-- bu sonuç kümesi öğretmen sayısı × ay sayısı ile sınırlıdır (tipik bir
-- okulda birkaç yüz satır), ham nöbet sayısından (binlerce olabilir)
-- BAĞIMSIZDIR — böylece 1000 satır sınırına pratikte hiç yaklaşılmaz.
--
-- SECURITY DEFINER DEĞİL — bilinçli tercih: bu fonksiyon çapraz-okul bir
-- ayrıcalık gerektirmiyor, çağıranın KENDİ okulunun verisini istiyor.
-- SECURITY INVOKER (varsayılan) ile duty_assignments/teachers üzerindeki
-- mevcut RLS politikaları ZATEN doğru izolasyonu sağlıyor — 0016'nın
-- "süper admin bilinçli TEK istisna, sıradan sorgular SECURITY DEFINER
-- kullanmaz" ilkesiyle tutarlı. `where school_id = current_school_id()`
-- filtresi RLS'in ÜZERİNE ek bir savunma değil, sorgu planlayıcısının
-- idx_duty_assignments_school_id'yi (0012) kullanabilmesi için (RLS'in
-- kendisi de aynı koşulu zaten uyguluyor, iki kez yazmak zararsız).
create or replace function public.get_yearly_distribution()
returns table (
  teacher_id uuid,
  full_name text,
  month_key text,
  duty_count int
)
language sql
stable
as $$
  select
    da.teacher_id,
    t.full_name,
    to_char(da.duty_date, 'YYYY-MM') as month_key,
    count(*)::int as duty_count
  from public.duty_assignments da
  join public.teachers t on t.id = da.teacher_id
  where da.school_id = public.current_school_id()
  group by da.teacher_id, t.full_name, to_char(da.duty_date, 'YYYY-MM')
  order by month_key, full_name;
$$;

grant execute on function public.get_yearly_distribution() to authenticated;
