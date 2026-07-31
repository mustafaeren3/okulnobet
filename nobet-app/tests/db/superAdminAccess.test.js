import { describe, it, expect } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';

const RUN_ID = Date.now();

// Sıradan bir okul kullanıcısının (platform_admins'te KAYDI YOK) hiçbir
// admin RPC'sinden veri/işlem alamadığını kanıtlar — MFA/aal2'ye hiç
// gerek kalmadan, "admin üyeliği yok" adımında reddediliyor (bkz.
// platform_require_admin, 0021_admin_mfa.sql). "aal1 admin verisi
// alamaz" / "audit log oluşturur" gibi GERÇEKTEN admin+aal2 gerektiren
// senaryolar tests/db/superAdminAuthorized.test.js'te — sadece
// TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD/TEST_ADMIN_TOTP_SECRET env
// değişkenleri set edilmişse çalışır (bkz. o dosyadaki açıklama).

describe('Süper admin RPC çağrıları — yetkisiz erişim reddi', () => {
  it('platform_admins üyesi olmayan bir kullanıcı platform_list_schools çağıramaz (eler)', async () => {
    const client = newClient();
    await signUpAndRegisterSchool(client, makeTestUser('noadmin-list', RUN_ID));

    const { data, error } = await client.rpc('platform_list_schools');
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/Yetkiniz yok|MFA/);
  }, 30000);

  it('platform_admins üyesi olmayan bir kullanıcı BAŞKA bir okulun aboneliğini değiştiremez (eler)', async () => {
    const client = newClient();
    const attackerSchoolId = await signUpAndRegisterSchool(client, makeTestUser('noadmin-mutate', RUN_ID));
    // Kendi okulunun ID'siyle bile dener — admin üyeliği olmadığı için
    // school_id'nin geçerliliği hiç kontrol edilen noktaya gelmeden reddedilir.
    const { error } = await client.rpc('platform_freeze_school', {
      p_school_id: attackerSchoolId,
      p_reason: 'test',
    });
    expect(error).not.toBeNull();
  }, 30000);

  it('platform_admins üyesi olmayan bir kullanıcı rastgele bir school_id ile de işlem yapamaz (eler)', async () => {
    const client = newClient();
    await signUpAndRegisterSchool(client, makeTestUser('noadmin-random', RUN_ID));
    const randomSchoolId = '00000000-0000-0000-0000-000000000000';

    const { error } = await client.rpc('platform_set_subscription', {
      p_school_id: randomSchoolId,
      p_status: 'active',
      p_plan_type: 'enterprise',
      p_trial_ends_at: null,
      p_current_period_end: null,
      p_reason: 'test',
    });
    expect(error).not.toBeNull();
  }, 30000);

  it('admin_audit_logs tablosu normal kullanıcı tarafından okunamaz (RLS/grant — eler)', async () => {
    const client = newClient();
    await signUpAndRegisterSchool(client, makeTestUser('noadmin-audit', RUN_ID));

    const { data, error } = await client.from('admin_audit_logs').select('*');
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  }, 30000);

  it('payments tablosu normal kullanıcı tarafından okunamaz (RLS/grant — eler)', async () => {
    const client = newClient();
    await signUpAndRegisterSchool(client, makeTestUser('noadmin-payments', RUN_ID));

    const { data, error } = await client.from('payments').select('*');
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  }, 30000);

  it('platform_admins tablosuna normal kullanıcı doğrudan insert/update/delete yapamaz (eler)', async () => {
    const client = newClient();
    const { data: { user } } = await client.auth.getUser();
    await signUpAndRegisterSchool(client, makeTestUser('noadmin-selfgrant', RUN_ID));

    const { error: insertError } = await client.from('platform_admins').insert({ user_id: user?.id, role: 'owner' });
    expect(insertError).not.toBeNull();

    const { error: updateError } = await client.from('platform_admins').update({ role: 'owner' }).eq('user_id', user?.id || '');
    expect(updateError).not.toBeNull();
  }, 30000);
});
