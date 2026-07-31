// Varsayılan (ve şu an TEK) ödeme sağlayıcı implementasyonu — gerçek bir
// ödeme sağlayıcısı bağlanmadı (bkz. PHASE_REPORT.md). Her zaman null
// döner; çağıran bunu "ödeme sağlayıcı yok, talep kaydı oluştur" sinyali
// olarak yorumlar (bkz. app/(wizard)/account/actions.js).
export async function createCheckoutSession(_subscription, _plan) {
  return null;
}
