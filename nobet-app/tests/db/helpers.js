import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

// Tenant izolasyon testlerinin ortak kurulumu: iki taraflı "gerçek Supabase
// projesine karşı geçici okul + kullanıcı oluştur" mantığı burada tek yerde
// yaşar (bkz. tests/db/tenant-isolation*.test.js).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// label harf ağırlıklı olabilir ("bulk-shift-idem") — sadece rakamları
// almak aynı runId'yi paylaşan testler arasında ÇAKIŞAN telefonlar
// üretirdi. Basit bir karma ile label'ı da sayıya çeviriyoruz.
function labelHash(label) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return hash;
}

export function makeTestUser(label, runId) {
  return {
    email: `zzz-tenant-test-${label}-${runId}@example.invalid`,
    password: `TestPass${runId}!`,
    schoolName: `ZZZ_TENANT_TEST_OKUL_${label.toUpperCase()}`,
    // register_school artık p_phone alıyor (bkz. 0013_pricing_and_trial_limits.sql
    // — bir e-posta/telefon sadece bir deneme hesabı açabilir). Testte
    // her çağrı benzersiz bir telefon üretir, aksi halde 2. test
    // "telefon zaten kullanılmış" hatasıyla düşer.
    phone: `+905${String(runId + labelHash(label)).slice(-9).padStart(9, '0')}`,
  };
}

export function newClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('.env.local içinde NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY bulunamadı.');
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function signUpAndRegisterSchool(client, user) {
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: user.email,
    password: user.password,
  });
  if (signUpError) {
    throw new Error(`signUp başarısız (${user.email}): ${signUpError.message}`);
  }
  if (!signUpData.session) {
    throw new Error(
      `signUp oturum döndürmedi (${user.email}). Supabase Auth > Providers > Email > ` +
        `"Confirm email" ayarı açık olabilir; pilot/test ortamında kapatılmalı.`
    );
  }
  const { data: schoolId, error: rpcError } = await client.rpc('register_school', {
    p_name: user.schoolName,
    p_city: 'Test',
    p_district: 'Test',
    p_phone: user.phone,
  });
  if (rpcError) {
    throw new Error(`register_school başarısız (${user.email}): ${rpcError.message}`);
  }
  return schoolId;
}

// ── TOTP (RFC 6238) — admin MFA testlerinin (aal2'ye ulaşmak için)
// tarayıcısız, kütüphanesiz kod üretmesi için. Node'un yerleşik crypto'su
// yeterli, yeni bir bağımlılık gerekmedi. Sadece testlerde kullanılır.
function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (const char of clean) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function computeTotp(base32Secret, timeStepSeconds = 30, digits = 6, forTime = Date.now()) {
  const key = base32Decode(base32Secret);
  const counter = Math.floor(forTime / 1000 / timeStepSeconds);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const truncated =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(truncated % 10 ** digits).padStart(digits, '0');
}
