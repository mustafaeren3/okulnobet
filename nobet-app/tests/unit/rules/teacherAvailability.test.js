import { describe, it, expect } from 'vitest';
import { checkTeacherAvailability } from '@/lib/engine/rules/teacherAvailability';

describe('checkTeacherAvailability', () => {
  it('ALL modunda her gün uygun (geçer)', () => {
    const result = checkTeacherAvailability({
      teacher: { restriction_mode: 'ALL' },
      unavailableWeekdays: [1, 3],
      weekday: 1,
    });
    expect(result.eligible).toBe(true);
  });

  it('EXCEPT modunda listedeki gün uygun değil (eler)', () => {
    const result = checkTeacherAvailability({
      teacher: { restriction_mode: 'EXCEPT' },
      unavailableWeekdays: [2],
      weekday: 2,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('teacher_unavailable_weekday');
  });

  it('EXCEPT modunda listede olmayan gün uygun (geçer)', () => {
    const result = checkTeacherAvailability({
      teacher: { restriction_mode: 'EXCEPT' },
      unavailableWeekdays: [2],
      weekday: 3,
    });
    expect(result.eligible).toBe(true);
  });

  it('ONLY modunda listedeki gün uygun (geçer)', () => {
    const result = checkTeacherAvailability({
      teacher: { restriction_mode: 'ONLY' },
      unavailableWeekdays: [1, 3],
      weekday: 1,
    });
    expect(result.eligible).toBe(true);
  });

  it('ONLY modunda listede olmayan gün uygun değil (eler)', () => {
    const result = checkTeacherAvailability({
      teacher: { restriction_mode: 'ONLY' },
      unavailableWeekdays: [1, 3],
      weekday: 2,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('teacher_not_scheduled_weekday');
  });
});
