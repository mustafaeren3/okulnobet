// Haftalık yer (bölge) rotasyonu için saf yardımcılar. DB/Next.js/fetch
// bilmez. rotations tablosundaki zone_cursor'ın ne anlama geldiğini
// (okulun aktif bölgelerinin öncelik sıralı listesindeki index) ve
// tarihlerin haftalara nasıl gruplanacağını burada tanımlıyoruz.

// Bir tarihin ait olduğu haftanın Pazartesi'sini döndürür ('YYYY-MM-DD').
// weekday: JS Date#getDay() (0=Pazar...6=Cumartesi).
export function getWeekStart(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diffToMonday);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// Sıralı bir tarih listesini, ardışık haftalara göre gruplar (giriş
// sırası korunur). Her grup: { weekStart, dates: [...] }.
export function groupDatesByWeek(dates) {
  const weeks = [];
  const indexByWeekStart = new Map();
  for (const date of dates) {
    const weekStart = getWeekStart(date);
    if (!indexByWeekStart.has(weekStart)) {
      indexByWeekStart.set(weekStart, weeks.length);
      weeks.push({ weekStart, dates: [] });
    }
    weeks[indexByWeekStart.get(weekStart)].dates.push(date);
  }
  return weeks;
}

// zone_cursor'ı, okulun aktif bölgeleri listesindeki bir zone_id'ye
// çevirir (döngüsel — cursor liste uzunluğunu aşarsa başa sarar).
export function getZoneForCursor(zoneIds, cursor) {
  if (!zoneIds.length) return null;
  return zoneIds[((cursor % zoneIds.length) + zoneIds.length) % zoneIds.length];
}
