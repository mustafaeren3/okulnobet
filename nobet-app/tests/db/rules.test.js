import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { HARD_RULE_KEYS, getActiveHardRuleKeys, setHardRuleActive } from '@/lib/db/rules';
import { checkAssignmentEligibility } from '@/lib/db/eligibility';

const RUN_ID = Date.now();

describe('lib/db/rules — getActiveHardRuleKeys + setHardRuleActive', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('rules', RUN_ID));
  }, 30000);

  it('rules tablosunda hiç satır yoksa tüm hard rule\'lar etkin sayılır (geçer)', async () => {
    const activeKeys = await getActiveHardRuleKeys(client, schoolId);
    expect([...activeKeys].sort()).toEqual([...HARD_RULE_KEYS].sort());
  });

  it('setHardRuleActive(false) bir kuralı devre dışı bırakır, diğerleri etkin kalır', async () => {
    await setHardRuleActive(client, schoolId, 'branch_match', false);

    const activeKeys = await getActiveHardRuleKeys(client, schoolId);
    expect(activeKeys.has('branch_match')).toBe(false);
    expect(activeKeys.has('teacher_availability')).toBe(true);
    expect(activeKeys.size).toBe(HARD_RULE_KEYS.length - 1);
  });

  it('setHardRuleActive(true) daha önce kapatılmış bir kuralı yeniden açar', async () => {
    await setHardRuleActive(client, schoolId, 'branch_match', true);

    const activeKeys = await getActiveHardRuleKeys(client, schoolId);
    expect(activeKeys.has('branch_match')).toBe(true);
  });
});

describe('lib/db/rules — checkAssignmentEligibility devre dışı bırakılan kuralı yok sayar', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('rules-elig', RUN_ID));
  }, 30000);

  it('branch_match kapatılınca branş uyuşmazlığı olan öğretmen yine de uygun sayılır', async () => {
    const teacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_RULES_ELIG_T1',
      branch: 'müzik',
    });
    const zone = await createDutyZone(client, schoolId, {
      name: 'ZZZ_TENANT_TEST_RULES_ELIG_ZONE',
      allowed_branches: ['sınıf'], // 'müzik' burada yok — normalde eler
    });

    const before = await checkAssignmentEligibility(client, {
      schoolId,
      teacherId: teacher.id,
      zoneId: zone.id,
      date: '2026-10-06',
    });
    expect(before.eligible).toBe(false);

    await setHardRuleActive(client, schoolId, 'branch_match', false);

    const after = await checkAssignmentEligibility(client, {
      schoolId,
      teacherId: teacher.id,
      zoneId: zone.id,
      date: '2026-10-06',
    });
    expect(after.eligible).toBe(true);
  }, 15000);
});
