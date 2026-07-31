// Ödeme sağlayıcı sözleşmesi — Stripe/iyzico/PayTR gibi gerçek bir
// sağlayıcı bağlanana kadar TEK implementasyonu lib/payments/mock.js.
// Kasıtlı olarak sınıf/interface/DI container YOK (CLAUDE.md "DI
// container yasak" kuralı) — düz bir fonksiyon sözleşmesi, ikinci
// gerçek sağlayıcı (örn. lib/payments/iyzico.js) eklenince
// `getPaymentProvider()`'daki tek switch değiştirilir, başka hiçbir
// katman bundan haberdar olmaz.
//
// createCheckoutSession(subscription, plan): sağlayıcı bağlıysa bir
// { url } (ödeme sayfası) döner; bağlı değilse null döner — çağıran
// (bkz. app/(wizard)/account/actions.js requestPremiumUpgrade) null
// durumunda "talep kaydı" akışına düşer.

import * as mockProvider from './mock';

export function getPaymentProvider() {
  return mockProvider;
}

export async function createCheckoutSession(subscription, plan) {
  const provider = getPaymentProvider();
  return provider.createCheckoutSession(subscription, plan);
}
