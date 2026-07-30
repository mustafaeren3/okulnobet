import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { getDutyZones, createDutyZone, updateDutyZone, deleteDutyZone } from '@/lib/db/dutyZones';

// lib/db katmanının gerçek Supabase'e karşı doğru çalıştığını doğrular
// (RLS izolasyonu tenant-isolation-phase2.test.js'te zaten kanıtlandı,
// burada fonksiyonel doğruluk test ediliyor).

const RUN_ID = Date.now();

describe('lib/db/dutyZones', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('zones', RUN_ID));
  }, 30000);

  it('createDutyZone varsayılanları uygular + getDutyZones listeler', async () => {
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_ZONE_CRUD' });
    expect(zone.name).toBe('ZZZ_TENANT_TEST_ZONE_CRUD');
    expect(zone.required_count).toBe(1);
    expect(zone.active_days.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(zone.allowed_branches).toBeNull();
    expect(zone.blocked_branches).toBeNull();
    expect(zone.priority).toBe(0);
    expect(zone.is_active).toBe(true);

    const list = await getDutyZones(client, schoolId);
    expect(list.find((z) => z.id === zone.id)).toBeTruthy();
  });

  it('createDutyZone verilen değerleri kullanır (branş listeleri, öncelik, günler)', async () => {
    const zone = await createDutyZone(client, schoolId, {
      name: 'ZZZ_TENANT_TEST_ZONE_CRUD_2',
      required_count: 3,
      active_days: [1, 3],
      allowed_branches: ['sınıf', 'beden eğitimi'],
      blocked_branches: ['okul öncesi'],
      priority: 5,
    });
    expect(zone.required_count).toBe(3);
    expect(zone.active_days.sort()).toEqual([1, 3]);
    expect(zone.allowed_branches).toEqual(['sınıf', 'beden eğitimi']);
    expect(zone.blocked_branches).toEqual(['okul öncesi']);
    expect(zone.priority).toBe(5);
  });

  it('updateDutyZone değişiklikleri kalıcı olarak uygular', async () => {
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_ZONE_CRUD_3' });
    const updated = await updateDutyZone(client, zone.id, { required_count: 2, is_active: false });
    expect(updated.required_count).toBe(2);
    expect(updated.is_active).toBe(false);
  });

  it('deleteDutyZone kaydı kaldırır', async () => {
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_ZONE_CRUD_4' });
    await deleteDutyZone(client, zone.id);
    const list = await getDutyZones(client, schoolId);
    expect(list.find((z) => z.id === zone.id)).toBeUndefined();
  });

  it('priority eşit olan bölgeler eklenme sırasına göre listelenir (alfabetik değil)', async () => {
    const school2 = await signUpAndRegisterSchool(client, makeTestUser('zones-order', RUN_ID));
    // Bilerek alfabetik sırayla TERS bir eklenme sırası kullanıyoruz —
    // eskiden ikincil sıralama 'name' idi, bu da eklenme sırasını değil
    // alfabetik sırayı yansıtıyordu (rotasyon cursor'ının hangi bölgeye
    // denk geldiğini kullanıcının beklentisinden farklılaştırıyordu).
    const zoneZ = await createDutyZone(client, school2, { name: 'ZZZ_TENANT_TEST_ZONE_ORDER_Z' });
    const zoneA = await createDutyZone(client, school2, { name: 'ZZZ_TENANT_TEST_ZONE_ORDER_A' });
    const zoneM = await createDutyZone(client, school2, { name: 'ZZZ_TENANT_TEST_ZONE_ORDER_M' });

    const list = await getDutyZones(client, school2);
    expect(list.map((z) => z.id)).toEqual([zoneZ.id, zoneA.id, zoneM.id]);
  });
});
