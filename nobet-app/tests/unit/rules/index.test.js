import { describe, it, expect } from 'vitest';
import { checkHardRules } from '@/lib/engine/rules/index';

function baseContext(overrides = {}) {
  return {
    teacher: { restriction_mode: 'ALL', allow_double_duty: false, is_active: true, branch: 'sınıf' },
    zone: { is_active: true, active_days: [1, 2, 3, 4, 5], allowed_branches: null, blocked_branches: null },
    unavailableWeekdays: [],
    weekday: 1,
    closures: [],
    date: '2026-10-06',
    existingAssignmentCountForDate: 0,
    ...overrides,
  };
}

describe('checkHardRules', () => {
  it('hiçbir kural ihlal edilmiyorsa uygun (geçer)', () => {
    const result = checkHardRules(baseContext());
    expect(result.eligible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('tek bir kural ihlal edilirse uygun değil ve ihlal listelenir (eler)', () => {
    const result = checkHardRules(
      baseContext({ teacher: { restriction_mode: 'EXCEPT', allow_double_duty: false }, unavailableWeekdays: [1] })
    );
    expect(result.eligible).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].ruleKey).toBe('teacher_availability');
  });

  it('birden fazla kural aynı anda ihlal edilirse hepsi listelenir (eler)', () => {
    const result = checkHardRules(
      baseContext({
        teacher: { restriction_mode: 'EXCEPT', allow_double_duty: false },
        unavailableWeekdays: [1],
        closures: [{ start_date: '2026-10-01', end_date: '2026-10-10' }],
        existingAssignmentCountForDate: 1,
      })
    );
    expect(result.eligible).toBe(false);
    expect(result.violations).toHaveLength(3);
  });

  it('activeRuleKeys verilmezse tüm kurallar etkin sayılır (geriye dönük uyumluluk, geçer)', () => {
    const result = checkHardRules(
      baseContext({ teacher: { restriction_mode: 'EXCEPT', allow_double_duty: false }, unavailableWeekdays: [1] })
    );
    expect(result.eligible).toBe(false); // teacher_availability hâlâ devrede
  });

  it('activeRuleKeys bir kuralı dışlarsa o kuralın ihlali görmezden gelinir (eler — ihlal olmasına rağmen uygun)', () => {
    const result = checkHardRules(
      baseContext({ teacher: { restriction_mode: 'EXCEPT', allow_double_duty: false }, unavailableWeekdays: [1] }),
      { activeRuleKeys: new Set(['active_status', 'zone_active_day', 'branch_match', 'zone_closure', 'max_duty_per_day']) }
    );
    expect(result.eligible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('activeRuleKeys boş Set ise hiçbir kural çalışmaz, her zaman uygun (eler)', () => {
    const result = checkHardRules(
      baseContext({ teacher: { is_active: false } }), // normalde active_status'u ihlal eder
      { activeRuleKeys: new Set() }
    );
    expect(result.eligible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
