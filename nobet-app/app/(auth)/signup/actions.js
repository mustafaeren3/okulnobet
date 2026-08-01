'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSchoolsForDistrict } from '@/lib/data/mebSchoolLookup';
import { mapAuthErrorMessage, sanitizeDbErrorMessage } from '@/lib/errors';

// İki aşamalı kayıt: (1) hesap oluştur — e-postaya 6 haneli OTP gider,
// (2) kod doğrulanınca okul oluşturur. OTP doğrulanmadan school/
// school_users/hiçbir tenant verisi OLUŞMAZ — register_school SADECE
// verifySignupCode() içinde, başarılı verifyOtp()'den SONRA çağrılıyor;
// startSignup() bunu hiç çağırmıyor ve hiç redirect etmiyor.
//
// ÖNKOŞUL (kod dışı — Supabase Auth Dashboard ayarı): Authentication >
// Providers > Email > "Confirm email" AÇIK olmalı. Kapalıysa signUp()
// kod göndermeden hemen bir session döner; aşağıda bu durum tespit
// edilip session fail-closed olarak hemen kapatılıyor — ama bu durumda
// kullanıcıya kod da gelmeyeceği için (Confirm email kapalıyken Supabase
// hiç kod göndermez) akış orada tıkanır. Bu bir kod hatası değil, dashboard
// ayarının kodun varsaydığıyla çelişmesidir — Supabase dashboard'undan
// doğrulanmalı, kod bunu kendi başına düzeltemez.

export async function fetchSchoolsForDistrict(il, ilce) {
  if (!il || !ilce) return [];
  return getSchoolsForDistrict(il, ilce);
}

// Kullanıcıya artık "okul türü" SORULMUYOR (isim zaten "... İlkokulu/
// Ortaokulu/Lisesi" içeriyor, ikinci kez sormak gereksiz tekrar). Tür,
// MEB listesinden seçilen okulun KENDİ türünden sessizce çıkarılıyor;
// listede olmayan (elle yazılan "Özel Okul"/"Diğer") okullar için MEB
// kaynaklı bir tür sinyali yok, bu yüzden genel 'diger' değerine düşülür.
async function inferSchoolType(il, ilce, okulAdi) {
  const options = await getSchoolsForDistrict(il, ilce);
  const match = options.find((s) => s.name === okulAdi);
  return match?.type || 'diger';
}

export async function startSignup({ fullName, email, password, okulAdi, il, ilce }) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: mapAuthErrorMessage(error.message) };

  // Supabase'in anti-enumeration deseni: e-posta zaten kayıtlı VE
  // onaylıysa signUp() hata döndürmez, data.user.identities boş dizi
  // gelir (aksi halde var olan hesapların e-postasını deneyerek "bu
  // e-posta kayıtlı mı" bilgisi sızdırılabilirdi). Bu tek durumda
  // kullanıcıya açıkça söylüyoruz — zaten kendi e-postası, sızıntı yok.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: 'Bu e-posta adresiyle zaten bir hesap var.' };
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  return { ok: true };
}

export async function resendSignupCode(email) {
  const supabase = createClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) return { error: mapAuthErrorMessage(error.message) };
  return { ok: true };
}

export async function verifySignupCode({ email, code, okulAdi, il, ilce }) {
  const supabase = createClient();

  const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
  if (verifyError) return { error: mapAuthErrorMessage(verifyError.message) };

  const schoolType = await inferSchoolType(il, ilce, okulAdi);
  const { error: rpcError } = await supabase.rpc('register_school', {
    p_name: okulAdi,
    p_city: il,
    p_district: ilce,
    p_school_type: schoolType,
  });
  if (rpcError) return { error: sanitizeDbErrorMessage(rpcError.message) };

  redirect('/dashboard');
}
