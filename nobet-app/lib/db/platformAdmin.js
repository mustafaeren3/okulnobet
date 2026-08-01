// Süper admin RPC çağrıları — tüm gerçek yetki kontrolü ve çapraz-okul
// erişimi DB tarafında (SECURITY DEFINER fonksiyonlar, bkz.
// supabase/migrations/0016/0021) yapılıyor; bu dosya sadece o
// fonksiyonları çağırıyor (CLAUDE.md mimari kural 2). MFA/AAL2 zorunluluğu
// (Admin v2) burada VE her platform_* RPC'sinin içinde (platform_require_admin())
// AYRI AYRI kontrol edilir — savunma amaçlı, DAL'daki kontrol atlanabilse
// (örn. RPC'ye doğrudan erişilse) bile RPC yine reddeder.

import { checkRateLimit } from './rateLimit';
import { logSecurityEvent } from './systemEvents';
import { sanitizeDbErrorMessage } from '@/lib/errors';
import { isDevEnvironment } from '@/lib/env';

// TEK RPC çağrı noktası — hata mesajı sıkılaştırması (O3 bulgusu) burada
// merkezi olarak uygulanır, her wrapper fonksiyonda tekrarlanmaz. Ham
// Postgres hatası (iç şema bilgisi sızdırabilir) generic bir mesaja
// dönüştürülür; kendi `raise exception 'Türkçe metin'` çağrılarımız
// (LEAK_PATTERNS'e uymayan) aynen geçer. Sıkılaştırılan hata, admin'in
// kendisinin görebileceği system_events'e RAW haliyle de loglanır — bilgi
// kaybolmuyor, sadece kullanıcıya gösterilmiyor.
async function callRpc(supabase, fnName, params) {
  const { data, error } = await supabase.rpc(fnName, params);
  if (error) {
    const safe = sanitizeDbErrorMessage(error.message);
    if (safe !== error.message) {
      await logSecurityEvent(supabase, 'admin_rpc_error', { fn: fnName, raw: error.message });
    }
    throw new Error(safe);
  }
  return data;
}

export async function isPlatformAdmin(supabase) {
  const data = await callRpc(supabase, 'platform_is_admin');
  return data === true;
}

// currentLevel (ŞU ANKİ oturumun doğrulama seviyesi) döner — nextLevel
// DEĞİL. nextLevel "faktör kayıtlıysa ulaşılABİLECEK seviye" demektir,
// erişim kararı için kullanılırsa MFA'yı anlamsız kılar (faktör kayıtlı
// ama HENÜZ challenge tamamlanmamış bir oturumu da geçirir).
export async function getCurrentAAL(supabase) {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw new Error(error.message);
  return data?.currentLevel ?? null; // 'aal1' | 'aal2' | null
}

export async function requirePlatformAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapılmamış.');
  const isAdmin = await isPlatformAdmin(supabase);
  if (!isAdmin) throw new Error('Yetkiniz yok.');
  // Geliştirme ortamında (next dev) MFA adımı atlanır — "giriş yapmış +
  // platform_admins üyesi" kontrolü DEV'DE DE korunur, sadece aal2 şartı
  // düşer. Production'da (ve testte) davranış değişmez. NOT: dev ortamı
  // AYRI bir Supabase projesine bağlanmalı — prod projesindeki RPC'ler
  // DB tarafında aal2'yi ayrıca zorunlu kılar (platform_require_admin),
  // o kontrol buradan etkilenmez ve etkilenmemeli.
  if (!isDevEnvironment()) {
    const aal = await getCurrentAAL(supabase);
    if (aal !== 'aal2') throw new Error('Bu işlem için MFA doğrulaması gerekli.');
  }

  // Düşük hacimli rate limit — ele geçirilmiş TEK bir admin oturumunun
  // scripted abuse yapmasını yavaşlatır (Y5). Bilinçli olarak burada,
  // tüm admin RPC çağrılarının TEK giriş noktasında — sadece mutasyon
  // action'larına eklemek yerine (daha basit, daha az kaçırma riski).
  // Rate-limit altyapısı henüz uygulanmadıysa (migration eksikse) AÇIK
  // KALIR (fail-open) — güvenlik sıkılaştırması panelin kendisini
  // kilitlememeli.
  const allowed = await checkRateLimit(supabase, `admin:${user.id}`, 60, 60).catch(() => true);
  if (!allowed) {
    await logSecurityEvent(supabase, 'admin_rate_limited', { user_id: user.id });
    throw new Error('Çok fazla istek yapıldı. Birazdan tekrar dene.');
  }
}

export async function getPlatformSchools(supabase) {
  return callRpc(supabase, 'platform_list_schools');
}

export async function extendSchoolTrial(supabase, schoolId, days, reason) {
  await callRpc(supabase, 'platform_extend_trial', { p_school_id: schoolId, p_days: days, p_reason: reason || null });
}

export async function setSchoolSubscription(supabase, schoolId, { status, planType, trialEndsAt, currentPeriodEnd, reason }) {
  await callRpc(supabase, 'platform_set_subscription', {
    p_school_id: schoolId,
    p_status: status,
    p_plan_type: planType,
    p_trial_ends_at: trialEndsAt || null,
    p_current_period_end: currentPeriodEnd || null,
    p_reason: reason || null,
  });
}

export async function freezeSchool(supabase, schoolId, reason) {
  await callRpc(supabase, 'platform_freeze_school', { p_school_id: schoolId, p_reason: reason || null });
}

// Faz C — denetim izi (bkz. 0022_admin_audit_log.sql).
export async function getPlatformAuditLogs(supabase, { limit, schoolId } = {}) {
  return callRpc(supabase, 'platform_list_audit_logs', { p_limit: limit || 100, p_school_id: schoolId || null });
}

// Faz 10 — analytics/lead listeleri (bkz. 0018_leads.sql).
export async function getPlatformEnterpriseLeads(supabase) {
  return callRpc(supabase, 'platform_list_enterprise_leads');
}

export async function getPlatformPurchaseIntents(supabase) {
  return callRpc(supabase, 'platform_list_purchase_intents');
}

// Faz E — dondurma/iptal dışındaki abonelik mutasyonları + manuel ödeme
// kaydı. Hepsi reason zorunlu (RPC seviyesinde de doğrulanıyor, bkz.
// 0024_admin_mutations.sql/0025_payments.sql).
export async function reopenSchool(supabase, schoolId, reason) {
  await callRpc(supabase, 'platform_reopen_school', { p_school_id: schoolId, p_reason: reason });
}

export async function cancelSubscription(supabase, schoolId, reason) {
  await callRpc(supabase, 'platform_cancel_subscription', { p_school_id: schoolId, p_reason: reason });
}

export async function adjustFreeQuota(supabase, schoolId, newQuota, reason) {
  await callRpc(supabase, 'platform_adjust_free_quota', { p_school_id: schoolId, p_new_quota: newQuota, p_reason: reason });
}

export async function recordPayment(supabase, { schoolId, amount, method, note, reason }) {
  await callRpc(supabase, 'platform_record_payment', {
    p_school_id: schoolId, p_amount: amount, p_method: method || null, p_note: note || null, p_reason: reason,
  });
}

export async function getPlatformPayments(supabase, { schoolId, limit } = {}) {
  return callRpc(supabase, 'platform_list_payments', { p_school_id: schoolId || null, p_limit: limit || 100 });
}

// Faz F — Genel Bakış'ın gerçek metrikleri (bkz. 0026_rate_limiting_and_events.sql).
export async function getGenerationSuccessRate(supabase) {
  return callRpc(supabase, 'platform_generation_success_rate'); // number | null (hiç üretim yoksa)
}

// Süper admin panel v2 — özet kartlar + grafik verisi (bkz.
// 0031_platform_dashboard_stats.sql). Tek jsonb, tek round-trip.
export async function getPlatformDashboardStats(supabase) {
  return callRpc(supabase, 'platform_dashboard_stats');
}

// Faz D — sunucu taraflı sayfalama/filtreleme (bkz. 0023_schools_pagination.sql).
// Dönüş: her satırda total_count (window function) — istemci sayfa
// sayısını buradan hesaplar, ayrı bir count sorgusu atmaz.
export async function getPlatformSchoolsPage(supabase, { search, city, district, plan, status, sort, page, pageSize, quickFilter } = {}) {
  return callRpc(supabase, 'platform_list_schools_page', {
    p_search: search || null,
    p_city: city || null,
    p_district: district || null,
    p_plan: plan || null,
    p_status: status || null,
    p_sort: sort || 'created_at_desc',
    p_page: page || 1,
    p_page_size: pageSize || 25,
    p_quick_filter: quickFilter || null,
  });
}

export async function getSchoolDetail(supabase, schoolId) {
  return callRpc(supabase, 'platform_get_school_detail', { p_school_id: schoolId }); // null ise okul bulunamadı
}

export async function addSchoolNote(supabase, schoolId, note) {
  await callRpc(supabase, 'platform_add_school_note', { p_school_id: schoolId, p_note: note });
}

// Admin ekleme/çıkarma — owner-only (bkz. 0021_admin_mfa.sql
// platform_require_owner).
export async function grantPlatformAdmin(supabase, email, role = 'admin') {
  await callRpc(supabase, 'platform_grant_admin', { p_email: email, p_role: role });
}

export async function revokePlatformAdmin(supabase, userId) {
  await callRpc(supabase, 'platform_revoke_admin', { p_user_id: userId });
}

export async function getPlatformAdmins(supabase) {
  return callRpc(supabase, 'platform_list_admins');
}
