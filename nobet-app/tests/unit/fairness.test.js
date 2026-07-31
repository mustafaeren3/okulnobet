import { describe, it, expect } from 'vitest';
import { computeFairnessScore, estimateMinutesSaved } from '@/lib/engine/fairness';

describe('computeFairnessScore', () => {
  it('herkes eşit sayıda nöbet tutuyorsa skor 100 döner (geçer)', () => {
    const score = computeFairnessScore({ a: 5, b: 5, c: 5 });
    expect(score).toBe(100);
  });

  it('dağılım eşitsizse skor 100den düşük döner (geçer)', () => {
    const score = computeFairnessScore({ a: 1, b: 10, c: 1 });
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('boş girdi için 100 döner (sınır durumu, geçer)', () => {
    expect(computeFairnessScore({})).toBe(100);
    expect(computeFairnessScore(undefined)).toBe(100);
  });
});

describe('estimateMinutesSaved', () => {
  it('nöbet sayısına orantılı dakika döner (geçer)', () => {
    expect(estimateMinutesSaved(10)).toBe(30);
  });

  it('negatif veya tanımsız girdi için 0 döner (eler)', () => {
    expect(estimateMinutesSaved(-5)).toBe(0);
    expect(estimateMinutesSaved(undefined)).toBe(0);
  });
});
