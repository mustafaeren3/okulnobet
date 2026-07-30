// 'YYYY-MM-DD' → JS Date#getDay() uyumlu haftagünü (0=Pazar...6=Cumartesi).
// new Date(y, m-1, d) YEREL saat diliminde oluşturulur — toISOString()/UTC
// parse etmenin aksine, UTC+3 gibi dilimlerde bir gün kayması riski yoktur.

export function getWeekday(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

export const DAY_TR = { 0: 'Pazar', 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi' };
