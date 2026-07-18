import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { setUnavailableWeekdays } from '@/lib/db/teacherAvailability';
import { checkAssignmentEligibility } from '@/lib/db/eligibility';

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
