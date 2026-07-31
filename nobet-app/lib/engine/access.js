// Merkezi yetkilendirme (feature gating) katmanı. Saf fonksiyonlar —
// DB/Next.js/fetch bilmez. Ücretsiz/premium ayrımına bağlı HER karar
// (ay kilidi, export/paylaşım/geçmiş butonları) buradan geçer; ne
// app/ katmanında ne de lib/db/ katmanında ayrı bir if(status==='active')
// tekrarlanmaz (CLAUDE.md: "kod içerisinde dağınık if/else kullanılmasın").

// Yalnızca ödemeli plan (standard/enterprise) VE status='active' premium
// sayılır. plan_type='free' okul status='active' olsa bile (Faz 9'dan beri
// ücretsiz plan zaman bazlı bitmiyor) premium DEĞİLDİR — kalıcı olarak
// feature-gated kalır. İki koşul da (plan VE durum) burada birlikte
// kontrol edilir, başka hiçbir yerde tekrarlanmaz.
export function isPremium(subscription) {
  return subscription?.status === 'active' && ['standard', 'enterprise'].includes(subscription?.plan_type);
}

export const FEATURES = {
  EXPORT_WORD: 'export_word',
  EXPORT_PDF: 'export_pdf',
  EXPORT_EXCEL: 'export_excel',
  PRINT: 'print',
  SHARE_SCHEDULE: 'share_schedule',
  VIEW_HISTORY: 'view_history',
  UNLIMITED_REGENERATE: 'unlimited_regenerate',
};

const FEATURE_KEYS = new Set(Object.values(FEATURES));

// feature: FEATURES sabitlerinden biri olmalı — yazım hatasını erken
// yakalamak için (aksi halde sessizce her zaman false dönüp fark
// edilmeyebilir).
export function canAccessFeature(subscription, feature) {
  if (!FEATURE_KEYS.has(feature)) {
    throw new Error(`Bilinmeyen özellik: ${feature}`);
  }
  return isPremium(subscription);
}

const MONTH_LABELS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

// 'YYYY-MM-DD' -> 'YYYY-MM'
export function getMonthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTH_LABELS_TR[m - 1]} ${y}`;
}

// Bir tarih aralığındaki takvim aylarının listesini döner — hangi
// ayların VAR olduğunu göstermek için (ay sekmeleri), satır verisi
// içermez. firstDate/lastDate o ayın startDate/endDate aralığıyla
// kesişen kısmıdır (ilk/son ay tam ay olmayabilir).
export function buildMonthList(startDate, endDate) {
  const [sy, sm] = startDate.split('-').map(Number);
  const [ey, em] = endDate.split('-').map(Number);

  const months = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const monthStart = `${key}-01`;
    const lastDayOfMonth = new Date(y, m, 0).getDate();
    const monthEnd = `${key}-${String(lastDayOfMonth).padStart(2, '0')}`;
    months.push({
      key,
      label: monthLabel(key),
      firstDate: monthStart < startDate ? startDate : monthStart,
      lastDate: monthEnd > endDate ? endDate : monthEnd,
    });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return months;
}

// Ücretsiz planda açık olan TEK ay: okulun EN ERKEN üretilmiş ayı (bkz.
// lib/db/dutyAssignments.js getEarliestAssignmentDate) — hangi tarihten
// türetildiği çağırana bağlı, burada sadece 'YYYY-MM-DD' -> 'YYYY-MM'.
export function getUnlockedMonthKey(startDate) {
  return getMonthKey(startDate);
}

// unlockedMonthKey: getUnlockedMonthKey(...)'den önceden hesaplanmış
// 'YYYY-MM'. Premium okulda her ay zaten açık, unlockedMonthKey hiç
// gerekmez (null geçilebilir).
export function isMonthUnlocked(monthKey, unlockedMonthKey, subscription) {
  return monthKey === unlockedMonthKey || isPremium(subscription);
}
