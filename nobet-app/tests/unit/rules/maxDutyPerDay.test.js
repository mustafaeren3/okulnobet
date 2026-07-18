import { describe, it, expect } from 'vitest';
import { checkMaxDutyPerDay } from '@/lib/engine/rules/maxDutyPerDay';

describe('checkMaxDutyPerDay', () => {
  it('çift nöbeti olmayan öğretmen, hiç ataması yoksa uygun (geçer)', () => {
    const result = checkMaxDutyPerDay({
      teacher: { allow_double_duty: false },
      existingAssignmentCountForDate: 0,
    });
    expect(result.eligible).toBe(true);
  });

  it('çift nöbeti olmayan öğretmen, 1 ataması varsa uygun değil (eler)', () => {
    const result = checkMaxDutyPerDay({
      teacher: { allow_double_duty: false },
      existingAssignmentCountForDate: 1,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('max_duty_per_day_reached');
  });

  it('çift nöbeti olan öğretmen, 1 ataması varsa hâlâ uygun (geçer)', () => {
    const result = checkMaxDutyPerDay({
      teacher: { allow_double_duty: true },
      existingAssignmentCountForDate: 1,
    });
    expect(result.eligible).toBe(true);
  });

  it('çift nöbeti olan öğretmen, 2 ataması varsa uygun değil (eler)', () => {
    const result = checkMaxDutyPerDay({
      teacher: { allow_double_duty: true },
      existingAssignmentCountForDate: 2,
    });
    expect(result.eligible).toBe(false);
  });
});
