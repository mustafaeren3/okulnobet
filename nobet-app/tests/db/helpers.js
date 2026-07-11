import { createClient } from '@supabase/supabase-js';

// Tenant izolasyon testlerinin ortak kurulumu: iki taraflı "gerçek Supabase
// projesine karşı geçici okul + kullanıcı oluştur" mantığı burada tek yerde
// yaşar (bkz. tests/db/tenant-isolation*.test.js).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function makeTestUser(label, runId) {
  return {
    email: `zzz-tenant-test-${label}-${runId}@example.invalid`,
    password: `TestPass${runId}!`,
    schoolName: `ZZZ_TENANT_TEST_OKUL_${label.toUpperCase()}`,
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
  });
  if (rpcError) {
    throw new Error(`register_school başarısız (${user.email}): ${rpcError.message}`);
  }
  return schoolId;
}
