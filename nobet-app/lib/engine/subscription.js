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

  if (status === 'frozen') {
    return { label: 'Dondurulmuş (Yönetici)', isUsable: false, daysRemaining: 0 };
  }

  return { label: 'Bilinmiyor', isUsable: false, daysRemaining: null };
}

const MAX_TRIAL_RANGE_DAYS = 31;

// Kullanıcı isteği: "deneme sürecinde her e-posta/telefon sadece 1 aylık
// program oluşturabilir" — deneme durumundaki bir okul, TEK bir "Program
// Oluştur" çağrısında en fazla ~1 ay (31 gün) genişliğinde bir tarih
// aralığı üretebilir. Ödemeli (active) planda bu kısıt yok. Saf fonksiyon:
// tarih farkını hesaplar, DB/UI bilmez.
export function checkTrialDateRangeAllowed({ status, startDate, endDate }) {
  if (status !== 'trialing') return { allowed: true };

  const start = new Date(startDate);
  const end = new Date(endDate);
  const spanDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (spanDays > MAX_TRIAL_RANGE_DAYS) {
    return {
      allowed: false,
      reason: `Deneme sürümünde tek seferde en fazla ${MAX_TRIAL_RANGE_DAYS} günlük bir program oluşturabilirsin (seçtiğin aralık ${spanDays} gün). Devam etmek için abonelik satın al.`,
    };
  }
  return { allowed: true };
}
