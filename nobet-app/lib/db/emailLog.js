// email_log / email_log_events tablolarına dokunan sorgular (bkz.
// supabase/migrations/0054_email_log.sql). Component/action'lar Supabase'i
// doğrudan çağırmaz (CLAUDE.md mimari kural 2).

import { sanitizeDbErrorMessage } from '@/lib/errors';

// signup/forgot-password action'ları signUp()/resend()/resetPasswordForEmail()
// BAŞARILI dönünce çağırır. Loglama, logSecurityEvent gibi asıl akışı ASLA
// kesmemeli — hata sessizce yutulur (kullanıcı için mail zaten gönderildi,
// sadece takip kaydı başarısız olmuş olur, bu onun kaydını engellememeli).
export async function logEmailPending(supabase, email, mailType, ip, userAgent) {
  try {
    await supabase.rpc('log_email_pending', {
      p_email: email,
      p_mail_type: mailType,
      p_ip: ip || null,
      p_user_agent: userAgent || null,
    });
  } catch {
    // kasıtlı: takip kaydı arızası kullanıcının akışını engellemesin
  }
}

// verifyOtp() (signup) veya updateUser({password}) (recovery) BAŞARILI
// olunca çağrılır — o an gerçek bir session var, auth.uid() RPC içinde
// sahiplik kontrolü olarak kullanılıyor (bkz. migration).
export async function markEmailVerified(supabase, email, mailType) {
  try {
    await supabase.rpc('mark_email_verified', { p_email: email, p_mail_type: mailType });
  } catch {
    // kasıtlı: takip kaydı arızası kullanıcının akışını engellemesin
  }
}

// SADECE app/api/webhooks/resend/route.js — service-role client (bkz.
// lib/supabase/admin.js) ile çağrılır, imza doğrulaması route'ta zaten
// yapılmış olur. Burada hata YUTULMAZ — webhook route'un 200/500 dönüşü
// (Resend'in yeniden deneme mantığı) buna bağlı.
export async function recordEmailEvent(adminClient, event) {
  const { error } = await adminClient.rpc('record_email_event', {
    p_provider: event.provider,
    p_provider_event_id: event.providerEventId,
    p_provider_message_id: event.providerMessageId,
    p_to_email: event.toEmail,
    p_mail_type_hint: event.mailTypeHint,
    p_event_type: event.eventType,
    p_occurred_at: event.occurredAt,
    p_raw_payload: event.rawPayload,
    p_failure_reason: event.failureReason || null,
  });
  if (error) throw new Error(error.message);
}

// ── Süper admin: Email Merkezi ──────────────────────────────────────
export async function getPlatformEmailLogPage(supabase, {
  dateFrom, dateTo, schoolId, userId, mailType, status, search, page, pageSize,
} = {}) {
  const { data, error } = await supabase.rpc('platform_list_email_log_page', {
    p_date_from: dateFrom || null,
    p_date_to: dateTo || null,
    p_school_id: schoolId || null,
    p_user_id: userId || null,
    p_mail_type: mailType || null,
    p_status: status || null,
    p_search: search || null,
    p_page: page || 1,
    p_page_size: pageSize || 25,
  });
  if (error) throw new Error(sanitizeDbErrorMessage(error.message));
  return data;
}

export async function getPlatformEmailLogStats(supabase) {
  const { data, error } = await supabase.rpc('platform_email_log_stats');
  if (error) throw new Error(sanitizeDbErrorMessage(error.message));
  return data;
}

export async function getPlatformEmailLogEvents(supabase, emailLogId) {
  const { data, error } = await supabase.rpc('platform_get_email_log_events', { p_email_log_id: emailLogId });
  if (error) throw new Error(sanitizeDbErrorMessage(error.message));
  return data;
}

export async function logPlatformEmailResend(supabase, email, mailType, reason) {
  const { error } = await supabase.rpc('platform_log_email_resend', {
    p_email: email,
    p_mail_type: mailType,
    p_reason: reason || null,
  });
  if (error) throw new Error(sanitizeDbErrorMessage(error.message));
}
