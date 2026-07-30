// Süper admin paneli özet metrikleri — saf fonksiyon, DB/Next.js bilmez.
// Girdi: lib/db/platformAdmin.js'in platform_list_schools() RPC'sinden
// dönen düz satırlar (school_id, teacher_count, subscription_status,
// trial_ends_at, current_period_end, created_at, ...).
//
// Ciro SADECE gerçekten ödemeli (status='active') okullar üzerinden
// hesaplanır — deneme sürümündeki okullar henüz gelir üretmiyor (ödeme
// entegrasyonu yok, bkz. 0010_subscriptions.sql). Fiyat kademesi
// SAKLANMIYOR, her okulun GÜNCEL öğretmen sayısına göre canlı hesaplanır
// (lib/engine/pricing.js ile aynı ilke).

import { getPricingTier } from './pricing';
import { getSubscriptionStatus } from './subscription';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function computePlatformMetrics(schools, now = new Date()) {
  const activeSchoolCount = schools.filter((s) =>
    getSubscriptionStatus({
      status: s.subscription_status,
      trialEndsAt: s.trial_ends_at,
      currentPeriodEnd: s.current_period_end,
      now,
    }).isUsable
  ).length;

  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const newThisWeekCount = schools.filter((s) => new Date(s.created_at) >= weekAgo).length;

  // teacher_count RPC'den Postgres bigint olarak gelir — Supabase JS
  // istemcisi bunu (hassasiyet kaybını önlemek için) STRING döner, bu
  // yüzden getPricingTier'a vermeden önce Number()'a çevriliyor (aksi
  // halde Number.isFinite bir string'i "sonlu değil" sayıp herkesi en
  // düşük kademeye düşürür).
  const estimatedMonthlyRevenue = schools
    .filter((s) => s.subscription_status === 'active')
    .reduce((sum, s) => sum + getPricingTier(Number(s.teacher_count)).monthly, 0);

  return { activeSchoolCount, newThisWeekCount, estimatedMonthlyRevenue };
}
