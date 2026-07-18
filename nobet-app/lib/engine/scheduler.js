// Toplu program üretiminin saf yardımcıları. DB/Next.js/fetch bilmez
// (CLAUDE.md kural 1). Orchestrator (lib/db/bulkSchedule.js) bu
// fonksiyonları DB'den çektiği veriyle besler.

// startDate/endDate: 'YYYY-MM-DD'. İkisi de dahil, sıralı çıktı.
// Yerel Date ile üretilir (UTC parse'ın tarih-kayması riskine düşmez,
// bkz. lib/engine/weekday.js).
export function eachDateStr(startDate, endDate) {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  const dates = [];
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// Bir gün toplu üretimde hiç işlenmemeli mi (hafta sonu veya resmi
// tatil)? Diğer takvim tipleri (half_day/ceremony/exam) bu turda
// normal gün sayılır — kullanıcı onayıyla bilinçli, PHASE_REPORT.md'de
// işaretli. weekday: JS Date#getDay() (0=Pazar, 6=Cumartesi).
export function isSchedulableDay({ weekday, calendarDay }) {
  if (weekday === 0 || weekday === 6) return false;
  if (calendarDay?.day_type === 'holiday') return false;
  return true;
}
