import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { createManualAssignment, swapAssignment } from '@/lib/db/dutyAssignments';

// swap_duty_assignment RPC'sinin (supabase/migrations/0042) gerçek
// Supabase'e karşı ATOMİK çalıştığını kanıtlar: kalite denetimi bulgusu —
// önceki remove+add iki-istekli "Değiştir" akışında ikinci adım
// başarısız olursa hücre boş kalıyordu. Bu testler: (1) başarılı
// değişimin gerçekten uygulandığını, (2) başka bir okulun öğretmeniyle
// değiştirme denendiğinde REDDEDİLDİĞİNİ VE ESKİ ATAMANIN AYNEN
// KALDIĞINI (rollback) kanıtlar.

const RUN_ID = Date.now();

describe('lib/db/dutyAssignments — swapAssignment (atomik Değiştir)', () => {
  let client, otherClient, schoolId, otherSchoolId;

  beforeAll(async () => {
    // İKİ AYRI client — signUp aynı client'ın oturumunu DEĞİŞTİRİR (son
    // signUp kazanır), tek client ile iki okul oluşturulursa ikinci
    // okulun sahibi oturumda kalır ve İLK okul için yapılan sonraki
    // insert'ler RLS'e takılır (tenant-isolation.test.js'teki clientA/
    // clientB deseniyle aynı, kasıtlı ayrım).
    client = newClient();
    otherClient = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('swap', RUN_ID));
    otherSchoolId = await signUpAndRegisterSchool(otherClient, makeTestUser('swap-other', RUN_ID));
  }, 30000);

  it('başarılı değişim: eski öğretmen kalkar, yeni öğretmen atanır, tek atama satırı kalır', async () => {
    const ali = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SWAP_ALI', branch: 'sınıf' });
    const ayse = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SWAP_AYSE', branch: 'sınıf' });
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_SWAP_ZONE_1' });

    const original = await createManualAssignment(client, schoolId, { teacherId: ali.id, zoneId: zone.id, date: '2026-09-01' });

    const swapped = await swapAssignment(client, original.id, ayse.id);
    expect(swapped.teachers.id).toBe(ayse.id);
    expect(swapped.duty_date).toBe('2026-09-01');
    expect(swapped.is_manual).toBe(true);

    const { data: rows } = await client.from('duty_assignments').select('teacher_id').eq('zone_id', zone.id).eq('duty_date', '2026-09-01');
    expect(rows).toHaveLength(1);
    expect(rows[0].teacher_id).toBe(ayse.id);
  }, 30000);

  it('başka okulun öğretmeniyle değiştirme reddedilir VE eski atama olduğu gibi kalır (rollback)', async () => {
    const ali = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SWAP_ROLLBACK_ALI', branch: 'sınıf' });
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_SWAP_ROLLBACK_ZONE' });
    const foreignTeacher = await createTeacher(otherClient, otherSchoolId, { full_name: 'ZZZ_TENANT_TEST_SWAP_FOREIGN', branch: 'sınıf' });

    const original = await createManualAssignment(client, schoolId, { teacherId: ali.id, zoneId: zone.id, date: '2026-09-02' });

    await expect(swapAssignment(client, original.id, foreignTeacher.id)).rejects.toThrow();

    // Eski atama SİLİNMEMİŞ olmalı — rollback kanıtı.
    const { data: rows } = await client.from('duty_assignments').select('id, teacher_id').eq('id', original.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].teacher_id).toBe(ali.id);
  }, 30000);

  it('var olmayan bir atama id\'siyle çağrılırsa açık hata verir', async () => {
    const ali = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SWAP_NOTFOUND_ALI', branch: 'sınıf' });
    await expect(swapAssignment(client, '00000000-0000-0000-0000-000000000000', ali.id)).rejects.toThrow();
  }, 30000);
});
