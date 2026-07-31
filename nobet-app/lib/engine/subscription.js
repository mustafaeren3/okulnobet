// Abonelik durumunu hesaplayan saf fonksiyonlar. DB/Next.js/fetch bilmez.
//
// Faz 9: zaman bazlı deneme (14 gün) kaldırıldı. Faz "Admin v2": şema da
// eski trial isimlerinden temizlendi — status artık
// active/past_due/expired/cancelled/frozen, plan_type artık
// free/standard/enterprise (bkz. 0020_subscription_model_v2.sql). Ücretsiz
// plan (plan_type='free') 'active' durumundadır — ayrı bir 'trialing'
// durumu yok, kısıt tarih değil özellik bazlı (bkz. lib/engine/access.js).

function daysBetween(from, to) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// now: test edilebilirlik için parametre olarak verilir, varsayılan
// gerçek şimdiki zaman.
export function getSubscriptionStatus({ status, currentPeriodEnd, now = new Date() }) {
  if (status === 'active') {
    return {
      label: 'Aktif',
      isUsable: true,
      daysRemaining: currentPeriodEnd ? Math.max(0, daysBetween(now, currentPeriodEnd)) : null,
    };
  }

  if (status === 'past_due') {
    return { label: 'Ödeme Gecikti', isUsable: false, daysRemaining: 0 };
  }

  if (status === 'expired') {
    return { label: 'Süresi Doldu', isUsable: false, daysRemaining: 0 };
  }

  if (status === 'cancelled') {
    return { label: 'İptal Edildi', isUsable: false, daysRemaining: 0 };
  }

  if (status === 'frozen') {
    return { label: 'Dondurulmuş (Yönetici)', isUsable: false, daysRemaining: 0 };
  }

  return { label: 'Bilinmiyor', isUsable: false, daysRemaining: null };
}
