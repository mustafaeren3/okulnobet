'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/db/platformAdmin';
import { checkRateLimit } from '@/lib/db/rateLimit';
import { logSecurityEvent } from '@/lib/db/systemEvents';

// Bu sayfanın TEK amacı aal1 bir admin oturumunu aal2'ye çıkarmak — bu
// yüzden buradaki guard aal2 İSTEMEZ (aksi halde kimse buraya hiç
// gelemezdi), sadece "giriş yapmış + platform_admins üyesi" ister. Gerçek
// veri erişimi hâlâ her admin RPC'sinin içinde ayrıca kontrol ediliyor.
async function requireAdminMembership(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const isAdmin = await isPlatformAdmin(supabase).catch(() => false);
  if (!isAdmin) redirect('/dashboard');
}

// Güvenlik denetimi bulgusu: cancelEnrollment/verifyEnrollment/
// startChallenge/verifyChallenge hepsi CLIENT'IN gönderdiği factorId'yi
// doğrudan Supabase'e geçiriyordu. Supabase'in kendi MFA endpoint'leri
// zaten çağıranın JWT'sindeki auth.uid()'e göre kapsıyor (başkasının
// faktörünü hiçbir zaman döndürmez/kabul etmez) — ama buna körü körüne
// güvenmek yerine, "başka bir kullanıcının secret/QR'ı asla
// görüntülenemez" garantisini KENDİ kodumuzda da doğrulanabilir hale
// getiriyoruz (savunma amaçlı ikinci katman, tek ekstra listFactors()
// çağrısı maliyetinde).
async function assertOwnFactor(supabase, factorId) {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { error: error.message };
  const owns = (data?.totp || []).some((f) => f.id === factorId);
  if (!owns) return { error: 'Geçersiz MFA faktörü.' };
  return null;
}

export async function startEnrollment() {
  const supabase = createClient();
  await requireAdminMembership(supabase);

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error) return { error: error.message };
  return { factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret };
}

export async function cancelEnrollment(factorId) {
  const supabase = createClient();
  await requireAdminMembership(supabase);
  const ownError = await assertOwnFactor(supabase, factorId);
  if (ownError) return ownError;
  // Doğrulanmamış (unverified) bir faktörün unenroll'u aal2 istemez —
  // kullanıcı QR'ı kapatıp yeniden başlatmak isterse eski deneme temizlenir.
  await supabase.auth.mfa.unenroll({ factorId });
  return { ok: true };
}

export async function verifyEnrollment({ factorId, code }) {
  const supabase = createClient();
  await requireAdminMembership(supabase);
  const ownError = await assertOwnFactor(supabase, factorId);
  if (ownError) return ownError;

  const { data: { user } } = await supabase.auth.getUser();
  const allowed = await checkRateLimit(supabase, `mfa:${user.id}`, 8, 300).catch(() => true);
  if (!allowed) {
    await logSecurityEvent(supabase, 'mfa_rate_limited', { user_id: user.id });
    return { error: 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.' };
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) return { error: challengeError.message };

  const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (verifyError) {
    await logSecurityEvent(supabase, 'mfa_enroll_failed', { user_id: user.id });
    return { error: 'Kod hatalı veya süresi dolmuş, tekrar dene.' };
  }

  redirect('/super-admin');
}

export async function startChallenge(factorId) {
  const supabase = createClient();
  await requireAdminMembership(supabase);
  const ownError = await assertOwnFactor(supabase, factorId);
  if (ownError) return ownError;

  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) return { error: error.message };
  return { challengeId: data.id };
}

export async function verifyChallenge({ factorId, challengeId, code }) {
  const supabase = createClient();
  await requireAdminMembership(supabase);
  const ownError = await assertOwnFactor(supabase, factorId);
  if (ownError) return ownError;

  const { data: { user } } = await supabase.auth.getUser();
  const allowed = await checkRateLimit(supabase, `mfa:${user.id}`, 8, 300).catch(() => true);
  if (!allowed) {
    await logSecurityEvent(supabase, 'mfa_rate_limited', { user_id: user.id });
    return { error: 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.' };
  }

  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
  if (error) {
    await logSecurityEvent(supabase, 'mfa_challenge_failed', { user_id: user.id });
    return { error: 'Kod hatalı veya süresi dolmuş, tekrar dene.' };
  }

  redirect('/super-admin');
}
