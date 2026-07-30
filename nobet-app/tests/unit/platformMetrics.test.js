import { describe, it, expect } from 'vitest';
import { computePlatformMetrics } from '@/lib/engine/platformMetrics';

const NOW = new Date('2026-07-22T12:00:00Z');

function school(overrides) {
  return {
    school_id: 'x',
    teacher_count: '10', // Supabase bigint -> string, testler bunu bilerek kullanıyor
    subscription_status: 'trialing',
    trial_ends_at: '2026-08-01T00:00:00Z',
    current_period_end: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

describe('computePlatformMetrics', () => {
  it('aktif (kullanılabilir) okulları sayar — trialing süresi dolmamışsa dahil', () => {
    const schools = [
      school({ subscription_status: 'trialing', trial_ends_at: '2026-08-01T00:00:00Z' }),
      school({ subscription_status: 'active' }),
      school({ subscription_status: 'expired' }),
      school({ subscription_status: 'frozen' }),
    ];
    const result = computePlatformMetrics(schools, NOW);
    expect(result.activeSchoolCount).toBe(2);
  });

  it('süresi geçmiş deneme okulunu aktif saymaz', () => {
    const schools = [school({ subscription_status: 'trialing', trial_ends_at: '2026-07-01T00:00:00Z' })];
    const result = computePlatformMetrics(schools, NOW);
    expect(result.activeSchoolCount).toBe(0);
  });

  it('son 7 günde kaydolan okulları sayar', () => {
    const schools = [
      school({ created_at: '2026-07-20T00:00:00Z' }), // 2 gün önce
      school({ created_at: '2026-07-01T00:00:00Z' }), // 21 gün önce
    ];
    const result = computePlatformMetrics(schools, NOW);
    expect(result.newThisWeekCount).toBe(1);
  });

  it('ciroyu SADECE active durumundaki okullardan, öğretmen sayısına göre kademeli hesaplar', () => {
    const schools = [
      school({ subscription_status: 'active', teacher_count: '10' }), // tier 0-20 -> 400
      school({ subscription_status: 'active', teacher_count: '25' }), // tier 21-40 -> 800
      school({ subscription_status: 'trialing', teacher_count: '100' }), // ciroya dahil değil
    ];
    const result = computePlatformMetrics(schools, NOW);
    expect(result.estimatedMonthlyRevenue).toBe(1200);
  });

  it('teacher_count string geldiğinde (Postgres bigint) doğru kademeyi bulur', () => {
    const schools = [school({ subscription_status: 'active', teacher_count: '61' })]; // tier 61+ -> 2000
    const result = computePlatformMetrics(schools, NOW);
    expect(result.estimatedMonthlyRevenue).toBe(2000);
  });
});
