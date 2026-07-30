// subscriptions tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2). Yazma izni yok — satırlar sadece register_school
// (SECURITY DEFINER) tarafından oluşturuluyor, bkz.
// supabase/migrations/0010_subscriptions.sql.

import { getSubscriptionStatus, checkTrialDateRangeAllowed } from '@/lib/engine/subscription';

export async function getSubscriptionForSchool(supabase, schoolId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('school_id', schoolId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Scheduling Engine'in ücretli/kilit değeri (otomatik program üretimi)
// bu kontrolün arkasına konur. Savunma amaçlı en derin noktaya kondu
// (lib/db/bulkSchedule.js'in başı) — hangi çağıran üzerinden gelirse
// gelsin (UI, ileride başka bir action) atlanamaz.
//
// dateRange verilirse (startDate/endDate) VE okul hâlâ deneme
// sürümündeyse, "deneme sürecinde en fazla 1 aylık program" kısıtı da
// burada uygulanır (bkz. lib/engine/subscription.js checkTrialDateRangeAllowed).
export async function requireUsableSubscription(supabase, schoolId, dateRange) {
  const subscription = await getSubscriptionForSchool(supabase, schoolId);
  if (!subscription) {
    throw new Error('Bu okul için abonelik kaydı bulunamadı. Lütfen destek ile iletişime geçin.');
  }
  const status = getSubscriptionStatus({
    status: subscription.status,
    trialEndsAt: subscription.trial_ends_at,
    currentPeriodEnd: subscription.current_period_end,
  });
  if (!status.isUsable) {
    throw new Error(`Abonelik durumu: ${status.label}. Devam etmek için Hesabım sayfasını kontrol edin.`);
  }

  if (dateRange) {
    const rangeCheck = checkTrialDateRangeAllowed({
      status: subscription.status,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    if (!rangeCheck.allowed) {
      throw new Error(rangeCheck.reason);
    }
  }
}
