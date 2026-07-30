import { describe, it, expect } from 'vitest';
import { checkMaxDutyPerWeek } from '@/lib/engine/rules/maxDutyPerWeek';

describe('checkMaxDutyPerWeek', () => {
  it('çift nöbeti olmayan öğretmen, o hafta hiç nöbeti yoksa uygun (geçer)', () => {
    const result = checkMaxDutyPerWeek({
      teacher: { allow_double_duty: false },
      existingAssignmentCountForWeek: 0,
    });
    expect(result.eligible).toBe(true);
  });

  it('çift nöbeti olmayan öğretmen, o hafta 1 nöbeti varsa uygun değil (eler)', () => {
    const result = checkMaxDutyPerWeek({
      teacher: { allow_double_duty: false },
      existingAssignmentCountForWeek: 1,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('max_duty_per_week_reached');
  });

  it('çift nöbetli öğretmen, o hafta 1 nöbeti varsa hâlâ uygun (geçer)', () => {
    const result = checkMaxDutyPerWeek({
      teacher: { allow_double_duty: true },
      existingAssignmentCountForWeek: 1,
    });
    expect(result.eligible).toBe(true);
  });

  it('çift nöbetli öğretmen, o hafta 2 nöbeti varsa uygun değil (eler)', () => {
    const result = checkMaxDutyPerWeek({
      teacher: { allow_double_duty: true },
      existingAssignmentCountForWeek: 2,
    });
    expect(result.eligible).toBe(false);
  });

  it('haftalık sayaç verilmemişse 0 sayılır (geçer)', () => {
    const result = checkMaxDutyPerWeek({ teacher: { allow_double_duty: false } });
    expect(result.eligible).toBe(true);
  });
});
