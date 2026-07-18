import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';

// generateBulkSchedule'ın gerçek Supabase verisiyle uçtan uca doğru
// çalıştığını kanıtlar: hafta sonu/tatil atlama, aynı gün çift atama
// olmaması, idempotency, adil dağılım.

const RUN_ID = Date.now();
// 2026-10-05 Pazartesi ... 2026-10-11 Pazar (5 hafta içi + 2 hafta sonu günü).
const START = '2026-10-05';
const END = '2026-10-11';

async function countAssignments(client, zoneId) {
  const { data, error } = await client.from('duty_assignments').select('duty_date, teacher_id').eq('zone_id', zoneId);
  if (error) throw new Error(error.message);
  return data;
}

describe('lib/db/bulkSchedule — generateBulkSchedule', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('bulk', RUN_ID));
  }, 30000);

  it('hafta sonlarını atlar, sadece hafta içi günlerde atama üretir', async () => {
    const teacher = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_BULK_T1', branch: 'sınıf' });
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_BULK_ZONE_1', required_count: 1 });

    const result = await generateBulkSchedule(client, { schoolId, startDate: START, endDate: END });
    expect(result.createdCount).toBeGreaterThanOrEqual(5); // en az bu zone için 5 hafta içi gün

    const rows = await countAssignments(client, zone.id);
    expect(rows).toHaveLength(5);
    const dates = rows.map((r) => r.duty_date).sort();
    expect(dates).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
    rows.forEach((r) => expect(r.teacher_id).toBe(teacher.id));
  }, 30000);

  it('resmi tatil olarak işaretlenen günü atlar', async () => {
    const school2 = await signUpAndRegisterSchool(client, makeTestUser('bulk-holiday', RUN_ID));
    await createTeacher(client, school2, { full_name: 'ZZZ_TENANT_TEST_BULK_HOL_T1', branch: 'sınıf' });
    const zone = await createDutyZone(client, school2, { name: 'ZZZ_TENANT_TEST_BULK_HOL_ZONE', required_count: 1 });

    const { error: calError } = await client
      .from('calendar_days')
      .insert({ school_id: school2, calendar_date: '2026-10-07', day_type: 'holiday', description: 'Test Tatili' });
    if (calError) throw new Error(calError.message);

    await generateBulkSchedule(client, { schoolId: school2, startDate: START, endDate: END });

    const rows = await countAssignments(client, zone.id);
    const dates = rows.map((r) => r.duty_date).sort();
    expect(dates).toEqual(['2026-10-05', '2026-10-06', '2026-10-08', '2026-10-09']);
  }, 30000);

  it('tek öğretmen + iki bölge: aynı günde çift atama yapmaz (double duty izni yok)', async () => {
    const school3 = await signUpAndRegisterSchool(client, makeTestUser('bulk-double', RUN_ID));
    const teacher = await createTeacher(client, school3, {
      full_name: 'ZZZ_TENANT_TEST_BULK_DBL_T1',
      branch: 'sınıf',
      allow_double_duty: false,
    });
    const zoneA = await createDutyZone(client, school3, { name: 'ZZZ_TENANT_TEST_BULK_DBL_ZONE_A', required_count: 1 });
    const zoneB = await createDutyZone(client, school3, { name: 'ZZZ_TENANT_TEST_BULK_DBL_ZONE_B', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school3, startDate: '2026-10-06', endDate: '2026-10-06' });

    const rowsA = await countAssignments(client, zoneA.id);
    const rowsB = await countAssignments(client, zoneB.id);
    const total = rowsA.length + rowsB.length;

    expect(total).toBe(1); // iki bölge de required_count=1 istiyor ama tek öğretmen var, sadece biri dolar
    if (rowsA.length) expect(rowsA[0].teacher_id).toBe(teacher.id);
    if (rowsB.length) expect(rowsB[0].teacher_id).toBe(teacher.id);
  }, 30000);

  it('iki kez çalıştırınca eski otomatik atamalar silinip yeniden üretilir (idempotency)', async () => {
    const school4 = await signUpAndRegisterSchool(client, makeTestUser('bulk-idem', RUN_ID));
    await createTeacher(client, school4, { full_name: 'ZZZ_TENANT_TEST_BULK_IDEM_T1', branch: 'sınıf' });
    const zone = await createDutyZone(client, school4, { name: 'ZZZ_TENANT_TEST_BULK_IDEM_ZONE', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school4, startDate: START, endDate: END });
    const firstRun = await countAssignments(client, zone.id);

    await generateBulkSchedule(client, { schoolId: school4, startDate: START, endDate: END });
    const secondRun = await countAssignments(client, zone.id);

    expect(secondRun).toHaveLength(firstRun.length);
  }, 30000);

  it('iki uygun öğretmen arasında adil dağılım yapar (fark en fazla 1)', async () => {
    const school5 = await signUpAndRegisterSchool(client, makeTestUser('bulk-fair', RUN_ID));
    const teacherA = await createTeacher(client, school5, { full_name: 'ZZZ_TENANT_TEST_BULK_FAIR_A', branch: 'sınıf' });
    const teacherB = await createTeacher(client, school5, { full_name: 'ZZZ_TENANT_TEST_BULK_FAIR_B', branch: 'sınıf' });
    const zone = await createDutyZone(client, school5, { name: 'ZZZ_TENANT_TEST_BULK_FAIR_ZONE', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school5, startDate: START, endDate: END });

    const rows = await countAssignments(client, zone.id);
    const countA = rows.filter((r) => r.teacher_id === teacherA.id).length;
    const countB = rows.filter((r) => r.teacher_id === teacherB.id).length;

    expect(countA + countB).toBe(5);
    expect(Math.abs(countA - countB)).toBeLessThanOrEqual(1);
  }, 30000);
});
