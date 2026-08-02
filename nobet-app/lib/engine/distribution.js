// Yıllık (çoklu-ay) dağılım istatistiklerinin saf hesaplayıcısı. DB/Next.js/
// fetch bilmez (CLAUDE.md kural 1). Aylık görünüm zaten Dashboard.jsx'te
// basit bir sayım (useMemo) olarak var ve dokunulmadı — bu dosya sadece
// TÜM üretilmiş ayları tek ekranda birleştiren "Yıllık" görünüm için.
//
// Kalite denetimi düzeltmesi: girdi artık HAM (1 satır = 1 nöbet) değil,
// ÖN-AGGREGATE (1 satır = bir öğretmenin bir aydaki TOPLAM nöbet sayısı) —
// bkz. lib/db/dutyAssignments.js getYearlyDistribution / supabase/
// migrations/0040. Aggregasyon Postgres'te yapıldığı için bu fonksiyona
// gelen satır sayısı ham nöbet sayısından bağımsız, öğretmen×ay ile
// sınırlı — 1000 satır limitine takılma riski burada YOK.

const MONTH_LABELS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTH_LABELS_TR[m - 1]} ${y}`;
}

// monthlyCounts: düz {teacherId, fullName, monthKey, count}[] — her satır
// BİR öğretmenin BİR aydaki toplam nöbet sayısı (aggregasyon zaten DB'de
// yapıldı, burada tekrar SAYILMAZ, sadece toplanır/şekillendirilir).
// teacherRoster: aktif öğretmen listesi {id, full_name}[] — 0 nöbetli
// öğretmen de sonuçta görünsün diye ayrıca verilir (monthlyCounts'ta hiç
// geçmeyebilir).
//
// Döndürür: { totalDuties, months, perTeacher }
// - months: aralıkta görülen tüm ay anahtarları ('YYYY-MM'), artan sırada.
// - perTeacher: her öğretmen için totalCount/percentageShare/monthWithMost/
//   monthlyBreakdown/averagePerActiveMonth (yalnızca nöbet tuttuğu aylara
//   göre ortalama — hiç nöbeti olmayan öğretmende 0).
export function buildYearlyDistribution(monthlyCounts, teacherRoster) {
  const monthSet = new Set();
  const perTeacherCounts = new Map();

  for (const row of monthlyCounts) {
    monthSet.add(row.monthKey);
  }
  for (const teacher of teacherRoster) {
    perTeacherCounts.set(teacher.id, { fullName: teacher.full_name, byMonth: new Map() });
  }

  const totalDuties = monthlyCounts.reduce((sum, row) => sum + row.count, 0);

  for (const row of monthlyCounts) {
    let entry = perTeacherCounts.get(row.teacherId);
    if (!entry) {
      entry = { fullName: row.fullName, byMonth: new Map() };
      perTeacherCounts.set(row.teacherId, entry);
    }
    entry.byMonth.set(row.monthKey, (entry.byMonth.get(row.monthKey) || 0) + row.count);
  }

  const months = Array.from(monthSet).sort();

  const perTeacher = Array.from(perTeacherCounts.entries()).map(([teacherId, entry]) => {
    const monthlyBreakdown = Array.from(entry.byMonth.entries())
      .map(([monthKey, count]) => ({ monthKey, monthLabel: monthLabel(monthKey), count }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    const totalCount = monthlyBreakdown.reduce((sum, m) => sum + m.count, 0);

    const monthWithMost = monthlyBreakdown.reduce(
      (best, m) => (!best || m.count > best.count ? m : best),
      null,
    );

    const activeMonthCount = monthlyBreakdown.length;

    return {
      teacherId,
      fullName: entry.fullName,
      totalCount,
      percentageShare: totalDuties > 0 ? (totalCount / totalDuties) * 100 : 0,
      monthWithMost: monthWithMost ? { monthKey: monthWithMost.monthKey, monthLabel: monthWithMost.monthLabel, count: monthWithMost.count } : null,
      monthlyBreakdown,
      averagePerActiveMonth: activeMonthCount > 0 ? totalCount / activeMonthCount : 0,
    };
  });

  perTeacher.sort((a, b) => b.totalCount - a.totalCount || a.fullName.localeCompare(b.fullName, 'tr'));

  return { totalDuties, months, perTeacher };
}
