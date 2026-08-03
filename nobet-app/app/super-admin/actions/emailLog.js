'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { logEmailPending, logPlatformEmailResend, getPlatformEmailLogEvents } from '@/lib/db/emailLog';
import { getClientContext } from '@/lib/requestContext';
import { mapAuthErrorMessage } from '@/lib/errors';

// "Maili tekrar gönder" — signUp/resend()/resetPasswordForEmail() PUBLIC
// GoTrue uç noktaları (kimlik doğrulaması gerektirmez, e-postanın kendisi
// yeterli) — admin burada o kullanıcı YERİNE geçmiyor, sadece aynı
// public API'yi tetikliyor. requirePlatformAdmin() BU eylemi (paneli
// kimin kullanabileceğini) korur, GoTrue çağrısının kendisini değil.
export async function resendEmailAction(email, mailType, reason) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);

    if (mailType !== 'confirmation' && mailType !== 'recovery') {
      throw new Error('Geçersiz mail türü.');
    }

    const { error } =
      mailType === 'confirmation'
        ? await supabase.auth.resend({ type: 'signup', email })
        : await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(mapAuthErrorMessage(error.message));

    const { ip, userAgent } = getClientContext();
    await logEmailPending(supabase, email, mailType, ip, userAgent);
    await logPlatformEmailResend(supabase, email, mailType, reason || 'Email Merkezi — manuel tekrar gönder');
  } catch (e) {
    return { error: e.message };
  }
  revalidatePath('/super-admin/email-center');
  return { ok: true };
}

export async function getEmailLogEventsAction(emailLogId) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const events = await getPlatformEmailLogEvents(supabase, emailLogId);
    return { ok: true, events };
  } catch (e) {
    return { error: e.message };
  }
}
