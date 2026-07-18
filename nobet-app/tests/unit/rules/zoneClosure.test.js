import { describe, it, expect } from 'vitest';
import { checkZoneClosure } from '@/lib/engine/rules/zoneClosure';

describe('checkZoneClosure', () => {
  it('kapanış aralığı dışındaki tarih uygun (geçer)', () => {
    const result = checkZoneClosure({
      closures: [{ start_date: '2026-10-01', end_date: '2026-10-05' }],
      date: '2026-10-10',
    });
    expect(result.eligible).toBe(true);
  });

  it('kapanış aralığı içindeki tarih uygun değil (eler)', () => {
    const result = checkZoneClosure({
      closures: [{ start_date: '2026-10-01', end_date: '2026-10-05' }],
      date: '2026-10-03',
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('zone_closed');
  });

  it('kapanış aralığının başlangıç/bitiş sınırları dahil (eler)', () => {
    const result = checkZoneClosure({
      closures: [{ start_date: '2026-10-01', end_date: '2026-10-05' }],
      date: '2026-10-05',
    });
    expect(result.eligible).toBe(false);
  });

  it('boş closures listesinde her tarih uygun (geçer)', () => {
    const result = checkZoneClosure({ closures: [], date: '2026-10-03' });
    expect(result.eligible).toBe(true);
  });
});
