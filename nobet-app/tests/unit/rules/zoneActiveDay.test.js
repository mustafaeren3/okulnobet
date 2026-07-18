import { describe, it, expect } from 'vitest';
import { checkZoneActiveDay } from '@/lib/engine/rules/zoneActiveDay';

describe('checkZoneActiveDay', () => {
  it('haftagünü active_days içindeyse uygun (geçer)', () => {
    const result = checkZoneActiveDay({ zone: { active_days: [1, 2, 3, 4, 5] }, weekday: 3 });
    expect(result.eligible).toBe(true);
  });

  it('haftagünü active_days içinde değilse uygun değil (eler)', () => {
    const result = checkZoneActiveDay({ zone: { active_days: [1, 2, 3, 4, 5] }, weekday: 6 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('zone_closed_weekday');
  });

  it('active_days boşsa hiçbir gün uygun değil (eler)', () => {
    const result = checkZoneActiveDay({ zone: { active_days: [] }, weekday: 1 });
    expect(result.eligible).toBe(false);
  });
});
