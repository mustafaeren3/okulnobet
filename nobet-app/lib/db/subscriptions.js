// subscriptions tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2). Doğrudan UPDATE izni yok — satırlar sadece
// register_school ve dar kapsamlı SECURITY DEFINER fonksiyonlar
// (increment_free_generation_usage, log_schedule_generation) tarafından
// değiştiriliyor, bkz. supabase/migrations/0010, 0017 ve 0020.

import { isPremium } from '@/lib/engine/access';
import { getSubscriptionStatus } from '@/lib/engine/subscription';
import { isDevEnvironment } from '@/lib/env';
import { applyUnlimitedOverlay } from '@/lib/engine/policy';

export async function getSubscriptionForSchool(supabase, schoolId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('school_id', schoolId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  // Muafiyet TEK noktadan uygulanıyor (bkz. lib/engine/policy.js) — iki
  // ayrı sebep, aynı overlay: (1) `next dev` kolaylığı, (2) oturum sahibi
  // platform_admins üyesi (süper admin) — "test yaparken hiçbir limit
  // istemiyorum" isteği. platform_is_admin() zaten var olan, RLS'i
  // bypass eden SECURITY DEFINER fonksiyon (bkz. 0016_super_admin.sql);
  // burada YENİDEN bir yetki kontrolü icat edilmiyor.
  if (isDevEnvironment()) return applyUnlimitedOverlay(data);

  const { data: isAdmin } = await supabase.rpc('platform_is_admin');
  if (isAdmin === true) return applyUnlimitedOverlay(data);

  return data;
}

// Temel kullanılabilirlik kontrolü (expired/cancelled/past_due/frozen
// okullar hiçbir şey üretemez). Scheduling Engine'in en derin noktasına
// konur (savunma amaçlı, bkz. lib/db/bulkSchedule.js) — hangi çağıran
// üzerinden gelirse gelsin atlanamaz. Ücretsiz (free) planın sayısal
// üretim kotası kısıtı KASITLI olarak burada DEĞİL — bkz. requireCanGenerateSchedule altındaki
// not: generateBulkSchedule motor testleri (tests/db/bulkSchedule.test.js)
// aynı okulda rotasyon sürekliliğini kanıtlamak için birden fazla kez
// çağrılıyor, bu meşru bir motor yeteneği (aralığı sonradan uzatmak gibi).
export async function requireUsableSubscription(supabase, schoolId) {
  const subscription = await getSubscriptionForSchool(supabase, schoolId);
  if (!subscription) {
    throw new Error('Bu okul için abonelik kaydı bulunamadı. Lütfen destek ile iletişime geçin.');
  }
  const status = getSubscriptionStatus({
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
  });
  if (!status.isUsable) {
    throw new Error(`Abonelik durumu: ${status.label}. Devam etmek için Hesabım sayfasını kontrol edin.`);
  }
  return subscription;
}

// UI'daki "Program Oluştur" akışının (runBulkSchedule + previewBulkSchedule,
// bkz. app/(wizard)/schedule/actions.js) kullandığı ek kısıt: ücretsiz plan
// sayısal bir kotaya kadar tam program üretebilir
// (subscriptions.free_generation_quota/used, bkz. 0020_subscription_model_v2.sql
// — süper admin kotayı artırabilir, bkz. Faz E platform_adjust_free_quota).
// Bilinçli olarak generateBulkSchedule'ın İÇİNE değil, onu çağıran action
// katmanına kondu — aksi halde motorun meşru çoklu-çağrı yeteneği (bkz.
// yukarıki not) bozulurdu.
export async function requireCanGenerateSchedule(supabase, schoolId) {
  const subscription = await requireUsableSubscription(supabase, schoolId);
  if (!isPremium(subscription) && subscription.free_generation_used >= subscription.free_generation_quota) {
    throw new Error('Ücretsiz plandaki program oluşturma hakkını kullandın. Devam etmek için Premium\'a geç.');
  }
  return subscription;
}

export async function incrementFreeGenerationUsage(supabase) {
  const { error } = await supabase.rpc('increment_free_generation_usage');
  if (error) throw new Error(error.message);
}

export async function logScheduleGeneration(supabase, { durationMs, createdCount, teacherCount, zoneCount, conflictCount, fairnessScore }) {
  const { error } = await supabase.rpc('log_schedule_generation', {
    p_duration_ms: durationMs,
    p_created_count: createdCount,
    p_teacher_count: teacherCount,
    p_zone_count: zoneCount,
    p_conflict_count: conflictCount,
    p_fairness_score: fairnessScore,
  });
  if (error) throw new Error(error.message);
}
