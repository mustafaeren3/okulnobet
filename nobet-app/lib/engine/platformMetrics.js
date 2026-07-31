// Süper admin paneli özet metrikleri — saf fonksiyon, DB/Next.js bilmez.
// Girdi: lib/db/platformAdmin.js'in platform_list_schools() RPC'sinden
// dönen düz satırlar (school_id, teacher_count, subscription_status,
// plan_type, created_at, ...).
//
// Faz "Admin v2": eski trial-tabanlı durumlar şemadan kaldırıldı (bkz.
// lib/engine/subscription.js) — ücretsiz (plan_type='free') okullar da
// artık status='active' oluyor, bu yüzden "premium mi" sorusu SADECE
// status'a değil plan_type'a da bakmalı (bkz. lib/engine/access.js
// isPremium — burada da aynı iki-koşullu mantık kullanılıyor, tek
// kaynaktan sapmasın diye import ediliyor).

import { STANDARD_YEARLY_PRICE } from './pricing';
import { getSubscriptionStatus } from './subscription';
import { isPremium } from './access';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function computePlatformMetrics(schools, now = new Date()) {
  const activeSchoolCount = schools.filter((s) =>
    getSubscriptionStatus({
      status: s.subscription_status,
      currentPeriodEnd: s.current_period_end,
      now,
    }).isUsable
  ).length;

  const freeSchoolCount = schools.filter((s) => s.plan_type === 'free').length;
  const standardSchoolCount = schools.filter((s) => s.plan_type === 'standard').length;
  const enterpriseSchoolCount = schools.filter((s) => s.plan_type === 'enterprise').length;
  const premiumSchoolCount = schools.filter((s) =>
    isPremium({ status: s.subscription_status, plan_type: s.plan_type })
  ).length;
  const conversionRate = schools.length ? premiumSchoolCount / schools.length : 0;

  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const newThisWeekCount = schools.filter((s) => new Date(s.created_at) >= weekAgo).length;

  const estimatedAnnualRevenue = premiumSchoolCount * STANDARD_YEARLY_PRICE;
  const estimatedMonthlyRevenue = estimatedAnnualRevenue / 12;

  return {
    activeSchoolCount,
    freeSchoolCount,
    standardSchoolCount,
    enterpriseSchoolCount,
    premiumSchoolCount,
    conversionRate,
    newThisWeekCount,
    estimatedMonthlyRevenue,
    estimatedAnnualRevenue,
  };
}
