import { createClient } from '@supabase/supabase-js';

// e2e testlerinin sentetik veri kurulumu. tests/db/helpers.js ile AYNI
// desen (gerçek Supabase projesine karşı, ZZZ_ önekli, anon key) —
// Playwright testleri BUNU Node tarafında (test dosyasının kendisinde,
// page.evaluate içinde DEĞİL) çağırır, sonra gerçek /login formunu
// sürer. Bu, @supabase/ssr'in çerez biçimini elle taklit etmek yerine
// uygulamanın KENDİ login server action'ının (app/(auth)/login/actions.js)
// çerezleri doğru şekilde yazmasını sağlar — daha basit, daha güvenilir.
//
// TEMİZLİK NOTU: tests/db/helpers.js'teki AYNI kısıt burada da geçerli —
// anon key ile auth.users/schools/school_users silinemez (RLS/grant
// kasıtlı olarak buna izin vermiyor). ZZZ_E2E_TEST_ öneki ile
// işaretlenen veriler test sonunda Supabase Dashboard'dan elle
// silinmelidir (bu projenin TÜM tests/db/* dosyalarındaki mevcut,
// önceden kabul edilmiş kısıt — burada yeni bir şey değil).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function createSyntheticSchool(label) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const runId = Date.now();
  const email = `zzz-e2e-test-${label}-${runId}@example.invalid`;
  const password = `TestPass${runId}!`;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) throw new Error(`signUp başarısız: ${signUpError.message}`);
  if (!signUpData.session) {
    throw new Error('signUp oturum döndürmedi — Supabase Auth "Confirm email" ayarı açık olabilir.');
  }

  const { data: schoolId, error: rpcError } = await supabase.rpc('register_school', {
    p_name: `ZZZ_E2E_TEST_OKUL_${label.toUpperCase()}_${runId}`,
    p_city: 'Test',
    p_district: 'Test',
    p_school_type: 'ilkokul',
  });
  if (rpcError) throw new Error(`register_school başarısız: ${rpcError.message}`);

  return { supabase, email, password, schoolId, runId };
}

// Gerçek /login formunu sürer (page.evaluate ile çerez enjekte etmez) —
// app/(auth)/login/actions.js server action'ı çerezleri kendi normal
// akışıyla yazar, bu yüzden @supabase/ssr'in dahili çerez biçimini
// bilmemize gerek kalmaz.
export async function loginViaUi(page, email, password) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}
