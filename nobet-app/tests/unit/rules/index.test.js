import { describe, it, expect } from 'vitest';
import { checkHardRules } from '@/lib/engine/rules/index';

function baseContext(overrides = {}) {
  return {
    teacher: { restriction_mode: 'ALL', allow_double_duty: false },
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
});
