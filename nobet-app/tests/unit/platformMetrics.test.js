import { describe, it, expect } from 'vitest';
import { computePlatformMetrics } from '@/lib/engine/platformMetrics';

const NOW = new Date('2026-07-22T12:00:00Z');

function school(overrides) {
  return {
    school_id: 'x',
    teacher_count: '10', // Supabase bigint -> string, testler bunu bilerek kullanıyor
    subscription_status: 'active',
    plan_type: 'free',
    current_period_end: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

describe('computePlatformMetrics', () => {
  it('aktif (kullanılabilir) okulları sayar — free+active dahil (geçer)', () => {
    const schools = [
      school({ subscription_status: 'active', plan_type: 'free' }),
      school({ subscription_status: 'active', plan_type: 'standard' }),
      school({ subscription_status: 'expired', plan_type: 'standard' }),
      school({ subscription_status: 'frozen', plan_type: 'free' }),
    ];
    const result = computePlatformMetrics(schools, NOW);
    expect(result.activeSchoolCount).toBe(2);
  });

  it('free/standard/enterprise okul sayısını ve premium/dönüşüm oranını hesaplar (geçer)', () => {
    const schools = [
      school({ plan_type: 'free' }),
      school({ plan_type: 'free' }),
      school({ plan_type: 'standard', subscription_status: 'active' }),
      school({ plan_type: 'enterprise', subscription_status: 'active' }),
      school({ plan_type: 'standard', subscription_status: 'expired' }), // ödemeli ama active değil -> premium sayılmaz
    ];
    const result = computePlatformMetrics(schools, NOW);
    expect(result.freeSchoolCount).toBe(2);
    expect(result.standardSchoolCount).toBe(2);
    expect(result.enterpriseSchoolCount).toBe(1);
    expect(result.premiumSchoolCount).toBe(2); // sadece active+standard/enterprise
    expect(result.conversionRate).toBe(0.4); // 2/5
  });

  it('okul yoksa dönüşüm oranı 0 döner, bölme hatası olmaz (sınır durumu, eler)', () => {
    expect(computePlatformMetrics([], NOW).conversionRate).toBe(0);
  });

  it('son 7 günde kaydolan okulları sayar (geçer)', () => {
    const schools = [
      school({ created_at: '2026-07-20T00:00:00Z' }), // 2 gün önce
      school({ created_at: '2026-07-01T00:00:00Z' }), // 21 gün önce
    ];
    const result = computePlatformMetrics(schools, NOW);
    expect(result.newThisWeekCount).toBe(1);
  });

  it('ciro SADECE gerçek premium (active+standard/enterprise) okul sayısı × sabit yıllık fiyat (geçer)', () => {
    const schools = [
      school({ plan_type: 'standard', subscription_status: 'active' }),
      school({ plan_type: 'enterprise', subscription_status: 'active' }),
      school({ plan_type: 'free', subscription_status: 'active' }), // ciroya dahil değil
    ];
    const result = computePlatformMetrics(schools, NOW);
    expect(result.estimatedAnnualRevenue).toBe(2980); // 2 x 1490
    expect(result.estimatedMonthlyRevenue).toBeCloseTo(2980 / 12);
  });
});
