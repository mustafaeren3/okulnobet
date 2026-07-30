// Basit adillik seçimi: uygun adaylar arasından, o ana kadar toplamda
// en az nöbet tutmuş olanları seçer. Haftalık sıralı yer değişimi
// (rotasyon) lib/db/bulkSchedule.js'in işi — burası sadece boş hücre
// doldurma/tekil seçim için adillik ölçütü. Saf fonksiyon.
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
