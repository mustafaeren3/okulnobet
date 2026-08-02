import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import {
  getAssistantPrincipals,
  createAssistantPrincipal,
  updateAssistantPrincipal,
  deleteAssistantPrincipal,
} from '@/lib/db/assistantPrincipals';
import { getRotationSettings, setRotationSettings } from '@/lib/db/assistantPrincipalRotationSettings';
import { createManualAssignment } from '@/lib/db/assistantPrincipalAssignments';

// lib/db katmanının assistant_principals + rotation_settings için gerçek
// Supabase'e karşı doğru çalıştığını doğrular (RLS izolasyonu
// tenant-isolation-phase2.test.js'te zaten kanıtlandı, burada fonksiyonel
// doğruluk test ediliyor: CRUD + ayar round-trip).

const RUN_ID = Date.now();

describe('lib/db/assistantPrincipals + assistantPrincipalRotationSettings', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('ap-crud', RUN_ID));
  }, 30000);

  it('createAssistantPrincipal + getAssistantPrincipals', async () => {
    const person = await createAssistantPrincipal(client, schoolId, { fullName: 'ZZZ_TENANT_TEST_AP_CRUD' });
    expect(person.full_name).toBe('ZZZ_TENANT_TEST_AP_CRUD');
    expect(person.is_active).toBe(true);

    const list = await getAssistantPrincipals(client, schoolId);
    expect(list.find((p) => p.id === person.id)).toBeTruthy();
  });

  it('updateAssistantPrincipal değişiklikleri kalıcı olarak uygular', async () => {
    const person = await createAssistantPrincipal(client, schoolId, { fullName: 'ZZZ_TENANT_TEST_AP_CRUD_2' });
    const updated = await updateAssistantPrincipal(client, person.id, { is_active: false, full_name: 'ZZZ_TENANT_TEST_AP_CRUD_2_RENAMED' });
    expect(updated.is_active).toBe(false);
    expect(updated.full_name).toBe('ZZZ_TENANT_TEST_AP_CRUD_2_RENAMED');
  });

  it('deleteAssistantPrincipal kaydı kaldırır', async () => {
    const person = await createAssistantPrincipal(client, schoolId, { fullName: 'ZZZ_TENANT_TEST_AP_CRUD_3' });
    await deleteAssistantPrincipal(client, person.id);
    const list = await getAssistantPrincipals(client, schoolId);
    expect(list.find((p) => p.id === person.id)).toBeUndefined();
  });

  it('rotasyon ayarı yoksa varsayılan (sequential_daily) döner', async () => {
    // Ayrı client — signUp paylaşılan `client`'ın oturumunu değiştirip
    // dosyadaki SONRAKİ testleri (schoolId'yi kullananları) bozardı.
    const otherClient = newClient();
    const school2 = await signUpAndRegisterSchool(otherClient, makeTestUser('ap-crud-default', RUN_ID));
    const settings = await getRotationSettings(otherClient, school2);
    expect(settings.mode).toBe('sequential_daily');
    expect(settings.blockSizeDays).toBeNull();
  });

  it('setRotationSettings + getRotationSettings round-trip yapar (upsert, çakışmada üzerine yazar)', async () => {
    await setRotationSettings(client, schoolId, { mode: 'n_day_block', blockSizeDays: 3 });
    let settings = await getRotationSettings(client, schoolId);
    expect(settings.mode).toBe('n_day_block');
    expect(settings.blockSizeDays).toBe(3);

    await setRotationSettings(client, schoolId, { mode: 'weekly_block', blockSizeDays: null });
    settings = await getRotationSettings(client, schoolId);
    expect(settings.mode).toBe('weekly_block');
    expect(settings.blockSizeDays).toBeNull();
  });

  // Kalite denetimi bulgusu: block_size_days'in üst sınırı yoktu (bkz.
  // supabase/migrations/0043 CHECK constraint).
  it('block_size_days 90\'ı aşarsa DB CHECK constraint\'i reddeder', async () => {
    const { error } = await client
      .from('assistant_principal_rotation_settings')
      .upsert({ school_id: schoolId, role_key: 'assistant_principal', mode: 'n_day_block', block_size_days: 91 }, { onConflict: 'school_id,role_key' });
    expect(error).not.toBeNull();
  });

  it('block_size_days 1-90 aralığında kabul edilir (sınır değerler)', async () => {
    await setRotationSettings(client, schoolId, { mode: 'n_day_block', blockSizeDays: 90 });
    const settings = await getRotationSettings(client, schoolId);
    expect(settings.blockSizeDays).toBe(90);
  });

  // Kalite denetimi bulgusu: personId önceden insert'ten önce aynı okula
  // ait mi diye doğrulanmıyordu (bkz. lib/db/ownership.js). İKİ AYRI
  // client — signUp aynı client'ın oturumunu değiştirir (bkz.
  // atomicSwap.test.js'teki aynı not).
  it('başka okulun görevli müdür yardımcısıyla manuel atama reddedilir', async () => {
    const otherClient = newClient();
    const otherSchoolId = await signUpAndRegisterSchool(otherClient, makeTestUser('ap-crud-foreign', RUN_ID));
    const foreignPerson = await createAssistantPrincipal(otherClient, otherSchoolId, { fullName: 'ZZZ_TENANT_TEST_AP_CRUD_FOREIGN' });

    await expect(
      createManualAssignment(client, schoolId, { personId: foreignPerson.id, date: '2026-10-10' }),
    ).rejects.toThrow(/bu okula ait değil/);
  });
});
