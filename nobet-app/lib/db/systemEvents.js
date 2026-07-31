// system_events tablosuna dokunan sorgular (bkz.
// supabase/migrations/0026_rate_limiting_and_events.sql).

import { sanitizeDbErrorMessage } from '@/lib/errors';

export async function logSecurityEvent(supabase, eventType, detail) {
  // Loglama hiçbir zaman asıl akışı (login/MFA) kesmemeli — hata olursa
  // sessizce yutulur, sadece konsola değil (CLAUDE.md: console.log ile
  // hassas veri basma) hiçbir yere yazılmaz, akış devam eder.
  try {
    await supabase.rpc('log_security_event', { p_event_type: eventType, p_detail: detail || null });
  } catch {
    // kasıtlı: loglama arızası kullanıcının giriş denemesini engellemesin
  }
}

export async function getPlatformSystemEvents(supabase, limit) {
  const { data, error } = await supabase.rpc('platform_list_system_events', { p_limit: limit || 100 });
  if (error) throw new Error(sanitizeDbErrorMessage(error.message));
  return data;
}
