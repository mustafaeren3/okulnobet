import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, computeTotp } from './helpers';

// Bu dosyadaki testler GERÇEK bir admin+aal2 oturumu gerektiriyor —
// platform_admins'e ilk satırın nasıl eklendiği bilerek uygulama dışı
// bırakıldı (bkz. PHASE_REPORT.md Faz 8.5: "kendini süper admin yap" adımı
// Supabase SQL Editor'de elle yapılıyor), bu yüzden otomatik test kendi
// admin hesabını oluşturamaz — anon-key'le çalışan bir istemcinin
// platform_admins'e satır eklemesi zaten GÜVENLİK GEREĞİ engellidir
// (bkz. tests/db/superAdminAccess.test.js). Bu testler SADECE aşağıdaki
// üç ortam değişkeni bir kere elle hazırlanmış bir test-admin hesabına
// işaret ediyorsa çalışır, yoksa (CI'da varsayılan) atlanır — kırmızı
// değil, "yapılandırılmamış" sayılır.
//
// Kurulum (bir kere, elle):
//   1. Supabase SQL Editor'de: insert into platform_admins (user_id, role)
//      select id, 'owner' from auth.users where email = 'TEST_ADMIN_EMAIL';
//   2. O hesapla /super-admin/mfa'da TOTP kurulumu yap, QR'daki "secret"i
//      (Base32) TEST_ADMIN_TOTP_SECRET olarak kaydet.
//   3. .env.local'e TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD / TEST_ADMIN_TOTP_SECRET ekle.
const hasTestAdmin = Boolean(
  process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD && process.env.TEST_ADMIN_TOTP_SECRET
);

async function signInAal1() {
  const client = newClient();
  const { error } = await client.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
  });
  if (error) throw new Error(`Test admin girişi başarısız: ${error.message}`);
  return client;
}

async function elevateToAal2(client) {
  const { data: factorsData, error: factorsError } = await client.auth.mfa.listFactors();
  if (factorsError) throw new Error(factorsError.message);
  const factor = (factorsData.totp || []).find((f) => f.status === 'verified');
  if (!factor) throw new Error('Test admin hesabında doğrulanmış bir TOTP faktörü yok.');

  const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError) throw new Error(challengeError.message);

  const code = computeTotp(process.env.TEST_ADMIN_TOTP_SECRET);
  const { error: verifyError } = await client.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code });
  if (verifyError) throw new Error(`MFA doğrulama başarısız: ${verifyError.message}`);
  return client;
}

describe.skipIf(!hasTestAdmin)('Süper admin — aal2 yetkili erişim (TEST_ADMIN_* env değişkenleri gerekli)', () => {
  it('aal1 (MFA tamamlanmamış) oturum admin verisi alamaz (eler)', async () => {
    const client = await signInAal1();
    const { data, error } = await client.rpc('platform_list_schools');
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/MFA/);
  }, 30000);

  it('aal2 oturum paneli açar, mutasyon audit log oluşturur, sonra geri alınabilir (geçer)', async () => {
    const client = await elevateToAal2(await signInAal1());

    const { data: schools, error } = await client.rpc('platform_list_schools');
    expect(error).toBeNull();
    expect(Array.isArray(schools)).toBe(true);
    if (!schools.length) return; // test projesinde hiç okul yoksa mutasyon kısmı atlanır

    const targetSchoolId = schools[0].school_id;
    const { error: freezeError } = await client.rpc('platform_freeze_school', {
      p_school_id: targetSchoolId,
      p_reason: 'otomatik test — superAdminAuthorized.test.js',
    });
    expect(freezeError).toBeNull();

    const { data: logs, error: logsError } = await client.rpc('platform_list_audit_logs', { p_limit: 5, p_school_id: targetSchoolId });
    expect(logsError).toBeNull();
    expect(logs.some((l) => l.action === 'subscription.freeze')).toBe(true);

    // Test okulunu dondurulmuş bırakmamak için geri al.
    await client.rpc('platform_reopen_school', { p_school_id: targetSchoolId, p_reason: 'otomatik test — geri alma' });
  }, 30000);

  it('platform_list_schools_page izin verilmeyen bir sort değeriyle reddeder (whitelist — eler)', async () => {
    const client = await elevateToAal2(await signInAal1());
    const { data, error } = await client.rpc('platform_list_schools_page', {
      p_sort: "created_at; drop table schools; --",
    });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  }, 30000);

  it('platform_list_schools_page geçerli parametrelerle sayfalı sonuç döner (geçer)', async () => {
    const client = await elevateToAal2(await signInAal1());
    const { data, error } = await client.rpc('platform_list_schools_page', { p_page: 1, p_page_size: 5 });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(5);
  }, 30000);
});
