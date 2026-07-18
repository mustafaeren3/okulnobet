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
});
