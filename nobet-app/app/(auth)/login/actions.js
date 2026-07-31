'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { checkRateLimit } from '@/lib/db/rateLimit';
import { logSecurityEvent } from '@/lib/db/systemEvents';

// Brute-force koruması: aynı e-posta için 5 dakikada en fazla 5 deneme
// (bkz. 0026_rate_limiting_and_events.sql check_rate_limit — Postgres
// tabanlı, harici servis yok). E-posta anahtar olarak kullanılıyor (IP
// değil) — Next.js Server Action'larında istemci IP'sine güvenilir
// biçimde erişim yok (bkz. teknik not, PHASE_REPORT).
export async function login(formData) {
  const supabase = createClient();
  const email = formData.get('email');
  const password = formData.get('password');

  const allowed = await checkRateLimit(supabase, `login:${String(email).toLowerCase()}`, 5, 300).catch(() => true);
  if (!allowed) {
    await logSecurityEvent(supabase, 'login_rate_limited', { email });
    return { error: 'Çok fazla başarısız deneme yapıldı. Birkaç dakika sonra tekrar dene.' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await logSecurityEvent(supabase, 'login_failed', { email });
    return { error: error.message };
  }
  redirect('/dashboard');
}
