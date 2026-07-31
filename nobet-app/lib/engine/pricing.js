// Fiyatlandırmayı hesaplayan saf fonksiyonlar. DB/Next.js/fetch bilmez.
//
// Faz 10 — öğretmen-sayısına-göre 4 kademeli fiyatlandırma (PRICING_TIERS)
// kaldırıldı, yerine kullanıcının verdiği tek sabit fiyat geldi: Standart
// plan = 1.490 TL/yıl, öğretmen sayısından bağımsız. Ücretsiz (free)
// planda ödeme yok; Kurumsal ("Teklif Al") sabit fiyatlı değil, bkz.
// app/(marketing)/kurumsal/.
export const STANDARD_YEARLY_PRICE = 1490;

// TL tutarını Türkçe biçimde ("1.490 ₺") döndürür — saf, Intl'e bağımlı
// ama DB/network yok.
export function formatTL(amount) {
  return new Intl.NumberFormat('tr-TR').format(amount) + ' ₺';
}
