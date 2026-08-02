import { describe, it, expect } from 'vitest';
import { buildYearlyDistribution } from '@/lib/engine/distribution';

const roster = [
  { id: 't1', full_name: 'Ahmet Yılmaz' },
  { id: 't2', full_name: 'Ayşe Demir' },
];

// Girdi artık ÖN-AGGREGATE (bkz. lib/db/dutyAssignments.js getYearlyDistribution
// / supabase/migrations/0040 get_yearly_distribution RPC) — bu testler
// {teacherId, fullName, monthKey, count}[] alır, ham 1-satır-1-nöbet değil.

describe('buildYearlyDistribution', () => {
  it('birden fazla aydaki ön-aggregate sayıları öğretmen bazında doğru toplar (geçer)', () => {
    const monthlyCounts = [
      { teacherId: 't1', fullName: 'Ahmet Yılmaz', monthKey: '2026-09', count: 2 },
      { teacherId: 't1', fullName: 'Ahmet Yılmaz', monthKey: '2026-10', count: 1 },
      { teacherId: 't2', fullName: 'Ayşe Demir', monthKey: '2026-09', count: 1 },
    ];
    const result = buildYearlyDistribution(monthlyCounts, roster);

    expect(result.totalDuties).toBe(4);
    expect(result.months).toEqual(['2026-09', '2026-10']);

    const t1 = result.perTeacher.find((t) => t.teacherId === 't1');
    expect(t1.totalCount).toBe(3);
    expect(t1.monthWithMost).toEqual({ monthKey: '2026-09', monthLabel: 'Eylül 2026', count: 2 });
    expect(t1.percentageShare).toBeCloseTo(75);
    expect(t1.averagePerActiveMonth).toBeCloseTo(1.5);
  });

  it('hiç nöbeti olmayan aktif öğretmen 0 sayımla listede yine de görünür (geçer)', () => {
    const monthlyCounts = [{ teacherId: 't1', fullName: 'Ahmet Yılmaz', monthKey: '2026-09', count: 1 }];
    const result = buildYearlyDistribution(monthlyCounts, roster);

    const t2 = result.perTeacher.find((t) => t.teacherId === 't2');
    expect(t2).toBeDefined();
    expect(t2.totalCount).toBe(0);
    expect(t2.monthWithMost).toBeNull();
    expect(t2.averagePerActiveMonth).toBe(0);
  });

  it('sayım listesi boşsa yüzde paylaşımı NaN/Infinity üretmez (eler)', () => {
    const result = buildYearlyDistribution([], roster);
    expect(result.totalDuties).toBe(0);
    for (const t of result.perTeacher) {
      expect(Number.isFinite(t.percentageShare)).toBe(true);
      expect(t.percentageShare).toBe(0);
    }
  });

  it('büyük hacimli (yüzlerce ay×öğretmen satırı) girdide toplam ve öğretmen sayımları eksiksiz kalır (geçer — 1000 satır sınırı bu katmanda yok, aggregasyon zaten DB tarafında yapıldı)', () => {
    // 50 öğretmen × 24 ay = 1200 ön-aggregate satır (gerçek DB senaryosunda
    // bu, on binlerce ham nöbet kaydının aggregasyonu olurdu) — bu
    // fonksiyonun kendisi artık ham satır sayısından etkilenmiyor, sadece
    // ön-aggregate satır sayısından (öğretmen×ay ile sınırlı).
    const bigRoster = Array.from({ length: 50 }, (_, i) => ({ id: `t${i}`, full_name: `Öğretmen ${i}` }));
    const monthlyCounts = [];
    for (let i = 0; i < 50; i++) {
      for (let m = 1; m <= 24; m++) {
        const monthKey = `${2024 + Math.floor((m - 1) / 12)}-${String(((m - 1) % 12) + 1).padStart(2, '0')}`;
        monthlyCounts.push({ teacherId: `t${i}`, fullName: `Öğretmen ${i}`, monthKey, count: 3 });
      }
    }
    const result = buildYearlyDistribution(monthlyCounts, bigRoster);

    expect(result.totalDuties).toBe(50 * 24 * 3); // 3600
    expect(result.perTeacher).toHaveLength(50);
    expect(result.months).toHaveLength(24);
    for (const t of result.perTeacher) {
      expect(t.totalCount).toBe(24 * 3); // 72
    }
  });
});
