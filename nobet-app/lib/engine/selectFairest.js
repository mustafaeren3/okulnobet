// Basit adillik seçimi: uygun adaylar arasından, o ana kadar toplamda
// en az nöbet tutmuş olanları seçer. rotations tablosundaki
// zone_cursor/day_cursor tabanlı gerçek rotasyon algoritması bilinçli
// olarak kapsam dışı (PHASE_REPORT.md'de işaretli, ayrı bir ürün kararı
// gerektiriyor). Saf fonksiyon.
//
// candidates: [{ teacher, dutyCount }] — dutyCount, o öğretmenin o ana
// kadarki toplam nöbet sayısı (tarih aralığı çağıran tarafın kararı).
// Eşitlik durumunda isim sırasına göre (tr) deterministik seçim yapılır.

export function selectFairest(candidates, requiredCount) {
  const sorted = [...candidates].sort((a, b) => {
    if (a.dutyCount !== b.dutyCount) return a.dutyCount - b.dutyCount;
    return a.teacher.full_name.localeCompare(b.teacher.full_name, 'tr');
  });
  return sorted.slice(0, requiredCount);
}
