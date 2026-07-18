import { describe, it, expect } from 'vitest';
import { getWeekday } from '@/lib/engine/weekday';

describe('getWeekday', () => {
  it('bilinen bir Salı tarihi için 2 döndürür', () => {
    // 2026-10-06 gerçek takvimde Salı.
    expect(getWeekday('2026-10-06')).toBe(2);
  });

  it('bilinen bir Pazar tarihi için 0 döndürür', () => {
    // 2026-10-04 gerçek takvimde Pazar.
    expect(getWeekday('2026-10-04')).toBe(0);
  });

  it('yıl sınırını doğru geçer (2026-12-31 Perşembe → 4)', () => {
    expect(getWeekday('2026-12-31')).toBe(4);
  });
});
