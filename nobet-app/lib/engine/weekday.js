// 'YYYY-MM-DD' → JS Date#getDay() uyumlu haftagünü (0=Pazar...6=Cumartesi).
// new Date(y, m-1, d) YEREL saat diliminde oluşturulur — toISOString()/UTC
// parse etmenin aksine, UTC+3 gibi dilimlerde bir gün kayması riski yoktur
// (bkz. lib/engine/schedule.js mondayOf() bilinen kırılganlığı, PHASE_REPORT
// Faz 1 teknik borç notu).

export function getWeekday(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}
