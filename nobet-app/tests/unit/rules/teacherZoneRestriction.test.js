import { describe, it, expect } from 'vitest';
import { checkTeacherZoneRestriction } from '@/lib/engine/rules/teacherZoneRestriction';

describe('checkTeacherZoneRestriction', () => {
  it('fixed_zone_id yoksa her bölgede uygun (geçer)', () => {
    const result = checkTeacherZoneRestriction({
      teacher: { fixed_zone_id: null },
      zone: { id: 'zone-a' },
    });
    expect(result.eligible).toBe(true);
  });

  it('fixed_zone_id kendi bölgesiyle eşleşiyorsa uygun (geçer)', () => {
    const result = checkTeacherZoneRestriction({
      teacher: { fixed_zone_id: 'zone-a' },
      zone: { id: 'zone-a' },
    });
    expect(result.eligible).toBe(true);
  });

  it('fixed_zone_id başka bir bölgeyse uygun değil (eler)', () => {
    const result = checkTeacherZoneRestriction({
      teacher: { fixed_zone_id: 'zone-a' },
      zone: { id: 'zone-b' },
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('teacher_fixed_to_other_zone');
  });
});
