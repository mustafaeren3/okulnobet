'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSchoolsForDistrict } from '@/lib/data/mebSchoolLookup';

// İki aşamalı kayıt: (1) hesap oluştur → e-postaya 6 haneli onay kodu
// gider (Supabase Auth "Confirm email" açık olmalı, e-posta şablonunda
// {{ .Token }} kullanılmalı — bkz. proje kurulum notları), (2) kod
// doğrulanınca okulu oluşturur. Okul, KOD DOĞRULANMADAN oluşturulmaz —
// aksi halde onaysız/sahte bir e-postayla da okul açılabilirdi.
// Telefon numarası da register_school'a gidiyor: "her e-posta/telefon
// sadece bir deneme hesabı açabilir" kısıtı orada (trial_registrations,
// bkz. 0013_pricing_and_trial_limits.sql) uygulanıyor.
//
// "Confirm email" KAPALIYSA (ör. Resend domain doğrulaması henüz yokken
// geçici test amaçlı) signUp çağrısı hiç kod göndermez, hesabı doğrudan
// oturumlu döner — bu durumda kod adımını beklemeden okulu burada kurup
// dashboard'a yönlendiriyoruz.

export async function fetchSchoolsForDistrict(il, ilce) {
  if (!il || !ilce) return [];
  return getSchoolsForDistrict(il, ilce);
}

export async function startSignup({ email, password, okulAdi, il, ilce, phone }) {
  const supabase = createClient();

  // GEÇİCİ TEŞHİS LOGLARI — signup akışı doğrulaması için, kalıcı değil.
  // result.data.session ham haliyle BİLEREK loglanmıyor: access_token/
  // refresh_token içeriyor, bunu Vercel log altyapısına düz metin yazmak
  // o session'ı ele geçirmeye yeten bir kimlik bilgisini sızdırmak demek
  // olurdu. Aynı teşhis değerini taşıyan, token içermeyen bir özet basılıyor.
  console.log('START SIGNUP');
  console.log({ email });
  console.log('BEFORE SIGNUP');

  const result = await supabase.auth.signUp({ email, password });

  console.log('AFTER SIGNUP');
  console.log({
    hasError: !!result.error,
    errorMessage: result.error?.message,
    sessionExists: !!result.data?.session,
    userId: result.data?.user?.id,
    userConfirmed: result.data?.user?.email_confirmed_at,
    identities: result.data?.user?.identities,
  });

  const { data, error } = result;
  if (error) return { error: error.message };

  if (data.session) {
    const { error: rpcError } = await supabase.rpc('register_school', {
      p_name: okulAdi,
      p_city: il,
      p_district: ilce,
      p_phone: phone,
    });
    if (rpcError) return { error: rpcError.message };
    redirect('/dashboard');
  }

  return { ok: true, needsCode: true };
}

export async function resendSignupCode(email) {
  const supabase = createClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function verifySignupCode({ email, code, okulAdi, il, ilce, phone }) {
  const supabase = createClient();

  const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
  if (verifyError) return { error: 'Kod hatalı veya süresi dolmuş: ' + verifyError.message };

  const { error: rpcError } = await supabase.rpc('register_school', {
    p_name: okulAdi,
    p_city: il,
    p_district: ilce,
    p_phone: phone,
  });
  if (rpcError) return { error: rpcError.message };

  redirect('/dashboard');
}
