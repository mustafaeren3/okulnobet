// Abonelik durumunu hesaplayan saf fonksiyonlar. DB/Next.js/fetch bilmez.
// Ödeme entegrasyonu yok — sadece deneme süresi/plan durumunu okunabilir
// bir özete çevirir.

function daysBetween(from, to) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// now: test edilebilirlik için parametre olarak verilir, varsayılan
// gerçek şimdiki zaman.
export function getSubscriptionStatus({ status, trialEndsAt, currentPeriodEnd, now = new Date() }) {
  if (status === 'active') {
    return {
      label: 'Aktif',
      isUsable: true,
      daysRemaining: currentPeriodEnd ? Math.max(0, daysBetween(now, currentPeriodEnd)) : null,
    };
  }

  if (status === 'trialing') {
    const daysRemaining = trialEndsAt ? daysBetween(now, trialEndsAt) : null;
    const expired = daysRemaining !== null && daysRemaining <= 0;
    return {
      label: expired ? 'Deneme Süresi Doldu' : 'Deneme Sürümü',
      isUsable: !expired,
      daysRemaining: daysRemaining !== null ? Math.max(0, daysRemaining) : null,
    };
  }

  if (status === 'expired') {
    return { label: 'Süresi Doldu', isUsable: false, daysRemaining: 0 };
  }

  if (status === 'canceled') {
    return { label: 'İptal Edildi', isUsable: false, daysRemaining: 0 };
  }

  return { label: 'Bilinmiyor', isUsable: false, daysRemaining: null };
}
