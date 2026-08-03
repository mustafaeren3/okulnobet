'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { checkRateLimit } from '@/lib/db/rateLimit';
import { logSecurityEvent } from '@/lib/db/systemEvents';
import { logEmailPending, markEmailVerified } from '@/lib/db/emailLog';
import { getClientContext } from '@/lib/requestContext';
import { mapAuthErrorMessage } from '@/lib/errors';
import { isPlatformAdmin } from '@/lib/db/platformAdmin';

// Signup'un iki fazlı OTP akışıyla AYNI mimari (bkz. app/(auth)/signup/
// actions.js): kendi reset-token sistemi YOK, Supabase Auth'un
// resetPasswordForEmail()/verifyOtp(type:'recovery')/updateUser() üçlüsü
// kullanılıyor. E-posta şablonu (supabase/config.toml
// [auth.email.template.recovery]) SADECE {{ .Token }} gösteriyor —
// signup'takiyle aynı gerekçeyle: linke tıklanırsa updateUser() hiç
// çağrılmadan bir session açılır, kullanıcı "yeni şifre belirle" adımını
// hiç görmeden ortada kalır.
//
// 3 ayrı server action (kod doğrulama / şifre belirleme ayrı adımlar,
// istenen akışla birebir): verifyResetCode() BAŞARILI olunca gerçek bir
// Supabase session cookie'ye YAZILIR (lib/supabase/server.js zaten
// cookie set ediyor) — setNewPassword() email/kod bilgisi OLMADAN, sadece
// o session'a dayanarak çalışır. Bu, Supabase'in resmi recovery akışının
// (link tıklayınca da aynı şekilde önce login olunur) OTP eşdeğeri.
export async function requestPasswordReset(email) {
  const supabase = createClient();

  const allowed = await checkRateLimit(supabase, `reset:${String(email).toLowerCase()}`, 5, 300).catch(() => true);
  if (!allowed) {
    await logSecurityEvent(supabase, 'password_reset_rate_limited', { email });
    return { error: 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.' };
  }

  // Supabase'in anti-enumeration deseni: e-posta kayıtlı olsun ya da
  // olmasın resetPasswordForEmail() AYNI (hatasız) sonucu döner — varlık/
  // yokluk hiçbir şekilde kullanıcıya sızdırılmıyor.
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { error: mapAuthErrorMessage(error.message) };

  const { ip, userAgent } = getClientContext();
  await logEmailPending(supabase, email, 'recovery', ip, userAgent);

  return { ok: true };
}

export async function resendPasswordResetCode(email) {
  return requestPasswordReset(email);
}

export async function verifyResetCode({ email, code }) {
  const supabase = createClient();

  // OTP kod tahmin/brute-force koruması — Supabase'in kendi
  // token_verifications rate limiti (config.toml, IP bazlı, 5 dk'da 30)
  // zaten var; bu e-posta bazlı ek katman savunma derinliği sağlıyor
  // (login'deki checkRateLimit ile aynı desen).
  const allowed = await checkRateLimit(supabase, `reset-verify:${String(email).toLowerCase()}`, 5, 300).catch(() => true);
  if (!allowed) {
    await logSecurityEvent(supabase, 'password_reset_rate_limited', { email });
    return { error: 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.' };
  }

  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
  if (error) {
    await logSecurityEvent(supabase, 'password_reset_failed', { email });
    return { error: mapAuthErrorMessage(error.message) };
  }

  await markEmailVerified(supabase, email, 'recovery');
  return { ok: true };
}

export async function setNewPassword(newPassword) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Oturum süresi doldu, kod doğrulama adımına dön.' };
  }

  // Supabase Auth, şifre değişikliğinde diğer aktif oturumları KENDİSİ
  // geçersiz kılar (dokümante edilmiş davranış) — burada AYRICA bir
  // "tüm oturumları kapat" çağrısı YOK, tekrar/hata kaynağı olmasın diye.
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: mapAuthErrorMessage(error.message) };

  await logSecurityEvent(supabase, 'password_reset_completed', { email: user.email });

  const isAdmin = await isPlatformAdmin(supabase).catch(() => false);
  redirect(isAdmin ? '/super-admin' : '/dashboard');
}
