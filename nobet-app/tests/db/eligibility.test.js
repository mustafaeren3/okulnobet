import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { setUnavailableWeekdays } from '@/lib/db/teacherAvailability';
import { checkAssignmentEligibility, getEligibleTeachersForZone, selectTeachersForZone } from '@/lib/db/eligibility';

// checkAssignmentEligibility'nin gerçek Supabase verisiyle uçtan uca
// (DB → lib/engine/rules) doğru çalıştığını kanıtlar.

const RUN_ID = Date.now();

describe('lib/db/eligibility — checkAssignmentEligibility', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('eligibility', RUN_ID));
  }, 30000);

  it('kısıtsız öğretmen + açık bölge + boş tarih → uygun (geçer)', async () => {
    const teacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_ELIG_TEACHER_1',
      branch: 'sınıf',
    });
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_ELIG_ZONE_1' });

    // 2026-10-06 gerçek takvimde Salı (weekday=2), zone.active_days
    // varsayılanı [1,2,3,4,5] içeriyor.
    const result = await checkAssignmentEligibility(client, {
      teacherId: teacher.id,
      zoneId: zone.id,
      date: '2026-10-06',
    });

    expect(result.eligible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('EXCEPT modunda müsait olmadığı gün + branş uyuşmazlığı → uygun değil, ihlaller listelenir (eler)', async () => {
    const teacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_ELIG_TEACHER_2',
      branch: 'müzik',
      restriction_mode: 'EXCEPT',
    });
    await setUnavailableWeekdays(client, schoolId, teacher.id, [2]); // Salı müsait değil

    const zone = await createDutyZone(client, schoolId, {
      name: 'ZZZ_TENANT_TEST_ELIG_ZONE_2',
      allowed_branches: ['sınıf'], // 'müzik' burada yok
    });

    const result = await checkAssignmentEligibility(client, {
      teacherId: teacher.id,
      zoneId: zone.id,
      date: '2026-10-06', // Salı
    });

    expect(result.eligible).toBe(false);
    const ruleKeys = result.violations.map((v) => v.ruleKey).sort();
    expect(ruleKeys).toEqual(['branch_match', 'teacher_availability']);
  });
});

describe('lib/db/eligibility — getEligibleTeachersForZone', () => {
  let client, schoolId, zone, eligibleTeacher, ineligibleTeacher;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('elig-scan', RUN_ID));

    eligibleTeacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_ELIG_SCAN_OK',
      branch: 'sınıf',
    });
    ineligibleTeacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_ELIG_SCAN_BAD',
      branch: 'sınıf',
      restriction_mode: 'EXCEPT',
    });
    await setUnavailableWeekdays(client, schoolId, ineligibleTeacher.id, [2]); // Salı müsait değil

    zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_ELIG_SCAN_ZONE' });
  }, 30000);

  it('okuldaki her öğretmen için bir sonuç döndürür, uygun/uygun değil doğru ayrılır', async () => {
    const results = await getEligibleTeachersForZone(client, {
      schoolId,
      zoneId: zone.id,
      date: '2026-10-06', // Salı
    });

    expect(results).toHaveLength(2);

    const eligibleResult = results.find((r) => r.teacher.id === eligibleTeacher.id);
    const ineligibleResult = results.find((r) => r.teacher.id === ineligibleTeacher.id);

    expect(eligibleResult.eligible).toBe(true);
    expect(ineligibleResult.eligible).toBe(false);
    expect(ineligibleResult.violations[0].ruleKey).toBe('teacher_availability');
  });
});

describe('lib/db/eligibility — selectTeachersForZone', () => {
  let client, schoolId, zone, busyTeacher, freeTeacher;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('elig-select', RUN_ID));

    busyTeacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_ELIG_SELECT_BUSY',
      branch: 'sınıf',
    });
    freeTeacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_ELIG_SELECT_FREE',
      branch: 'sınıf',
    });

    zone = await createDutyZone(client, schoolId, {
      name: 'ZZZ_TENANT_TEST_ELIG_SELECT_ZONE',
      required_count: 1,
    });

    // busyTeacher'ın geçmişte (başka bir tarihte) 1 nöbeti var, freeTeacher'ın hiç yok.
    const { error } = await client.from('duty_assignments').insert({
      school_id: schoolId,
      teacher_id: busyTeacher.id,
      zone_id: zone.id,
      duty_date: '2026-09-15',
    });
    if (error) throw new Error(`duty_assignment eklenemedi: ${error.message}`);
  }, 30000);

  it('required_count=1 iken iki uygun aday arasından en az nöbet tutanı seçer', async () => {
    const selected = await selectTeachersForZone(client, {
      schoolId,
      zoneId: zone.id,
      date: '2026-10-06', // Salı, her ikisi de bu tarihte müsait
    });

    expect(selected).toHaveLength(1);
    expect(selected[0].teacher.id).toBe(freeTeacher.id);
  });
});
