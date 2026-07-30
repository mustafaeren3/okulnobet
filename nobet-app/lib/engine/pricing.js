// Fiyatlandırma kademelerini hesaplayan saf fonksiyonlar. DB/Next.js/
// fetch bilmez. Kademe okul KAYDEDİLMEZ (bkz. 0013_pricing_and_trial_limits.sql
// yorumu) — öğretmen sayısı değiştikçe doğru fiyat burada CANLI hesaplanır.
//
// Kullanıcının tarifesi: 0-20 öğretmen, 21-40, 41-60, 61+ (sınırlar
// çakışmasın diye üst sınır bir SONRAKİ kademenin alt sınırından hemen
// önce kesiliyor — "20-40 arası" ifadesi 21'den başlıyor sayıldı).
export const PRICING_TIERS = [
  { key: 'tier_0_20', minTeachers: 0, maxTeachers: 20, monthly: 400, yearly: 2000 },
  { key: 'tier_21_40', minTeachers: 21, maxTeachers: 40, monthly: 800, yearly: 4000 },
  { key: 'tier_41_60', minTeachers: 41, maxTeachers: 60, monthly: 1200, yearly: 6000 },
  { key: 'tier_61_plus', minTeachers: 61, maxTeachers: Infinity, monthly: 2000, yearly: 10000 },
];

// Bir okulun GÜNCEL öğretmen sayısına göre hangi fiyat kademesinde
// olduğunu döner. teacherCount negatifse veya tanımsızsa en düşük
// kademeye düşer (savunma amaçlı).
export function getPricingTier(teacherCount) {
  const count = Number.isFinite(teacherCount) && teacherCount > 0 ? teacherCount : 0;
  return PRICING_TIERS.find((t) => count >= t.minTeachers && count <= t.maxTeachers) || PRICING_TIERS[PRICING_TIERS.length - 1];
}

// TL tutarını Türkçe biçimde ("1.200 ₺") döndürür — saf, Intl'e bağımlı
// ama DB/network yok.
export function formatTL(amount) {
  return new Intl.NumberFormat('tr-TR').format(amount) + ' ₺';
}
