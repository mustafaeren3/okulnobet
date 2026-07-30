import { describe, it, expect } from 'vitest';
import { checkMaxDutyPerDay } from '@/lib/engine/rules/maxDutyPerDay';

// Not: bu kural artık HERKES için günde 1'dir — allow_double_duty GÜN
// değil HAFTA bazlıdır (bkz. maxDutyPerWeek.test.js).

describe('checkMaxDutyPerDay', () => {
  it('o gün hiç ataması olmayan öğretmen uygun (geçer)', () => {
    const result = checkMaxDutyPerDay({
      teacher: { allow_double_duty: false },
      existingAssignmentCountForDate: 0,
    });
    expect(result.eligible).toBe(true);
  });

  it('o gün 1 ataması olan öğretmen uygun değil (eler)', () => {
    const result = checkMaxDutyPerDay({
      teacher: { allow_double_duty: false },
      existingAssignmentCountForDate: 1,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('max_duty_per_day_reached');
  });

  it('çift nöbetli öğretmen bile aynı GÜN ikinci nöbet alamaz (eler)', () => {
    const result = checkMaxDutyPerDay({
      teacher: { allow_double_duty: true },
      existingAssignmentCountForDate: 1,
    });
    expect(result.eligible).toBe(false);
  });
});
