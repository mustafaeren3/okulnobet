import { createClient } from '@supabase/supabase-js';

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
