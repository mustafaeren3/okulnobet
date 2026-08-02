import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { createManualAssignment, deleteAssignment, getAssignmentsForRange } from '@/lib/db/dutyAssignments';

const RUN_ID = Date.now();

describe('lib/db/dutyAssignments — createManualAssignment + deleteAssignment', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('manual', RUN_ID));
  }, 30000);

  it('createManualAssignment is_manual=true olarak kaydeder ve join ile döner', async () => {
    const teacher = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_MANUAL_T1', branch: 'sınıf' });
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_MANUAL_ZONE' });

    const row = await createManualAssignment(client, schoolId, {
      teacherId: teacher.id,
      zoneId: zone.id,
      date: '2026-10-06',
    });

    expect(row.is_manual).toBe(true);
    expect(row.teachers.full_name).toBe('ZZZ_TENANT_TEST_MANUAL_T1');
    expect(row.duty_zones.name).toBe('ZZZ_TENANT_TEST_MANUAL_ZONE');
  });

  it('deleteAssignment kaydı kaldırır', async () => {
    const teacher = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_MANUAL_T2', branch: 'sınıf' });
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_MANUAL_ZONE_2' });

    const row = await createManualAssignment(client, schoolId, {
      teacherId: teacher.id,
      zoneId: zone.id,
      date: '2026-10-07',
    });

    await deleteAssignment(client, row.id);

    const rows = await getAssignmentsForRange(client, schoolId, '2026-10-07', '2026-10-07');
    expect(rows.find((r) => r.id === row.id)).toBeUndefined();
  });

  // Kalite denetimi bulgusu: teacherId/zoneId önceden insert'ten önce
  // aynı okula ait mi diye doğrulanmıyordu (bkz. lib/db/ownership.js).
  // İKİ AYRI client kullanılıyor — signUp aynı client'ın oturumunu
  // DEĞİŞTİRİR, tek client ile ikinci bir okul açılırsa İLK okul için
  // yapılan sonraki insert'ler RLS'e takılır (bkz. atomicSwap.test.js'teki
  // aynı not).
  it('başka okulun öğretmeniyle manuel atama reddedilir', async () => {
    const otherClient = newClient();
    const otherSchoolId = await signUpAndRegisterSchool(otherClient, makeTestUser('manual-foreign-teacher', RUN_ID));
    const foreignTeacher = await createTeacher(otherClient, otherSchoolId, { full_name: 'ZZZ_TENANT_TEST_MANUAL_FOREIGN_T', branch: 'sınıf' });
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_MANUAL_FOREIGN_ZONE' });

    await expect(
      createManualAssignment(client, schoolId, { teacherId: foreignTeacher.id, zoneId: zone.id, date: '2026-10-08' }),
    ).rejects.toThrow(/bu okula ait değil/);
  });

  it('başka okulun bölgesiyle manuel atama reddedilir', async () => {
    const otherClient = newClient();
    const otherSchoolId = await signUpAndRegisterSchool(otherClient, makeTestUser('manual-foreign-zone', RUN_ID));
    const teacher = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_MANUAL_FZ_T', branch: 'sınıf' });
    const foreignZone = await createDutyZone(otherClient, otherSchoolId, { name: 'ZZZ_TENANT_TEST_MANUAL_FOREIGN_ZONE_2' });

    await expect(
      createManualAssignment(client, schoolId, { teacherId: teacher.id, zoneId: foreignZone.id, date: '2026-10-09' }),
    ).rejects.toThrow(/bu okula ait değil/);
  });
});
