import { describe, it, expect } from 'vitest';
import { getSubscriptionStatus } from '@/lib/engine/subscription';

describe('getSubscriptionStatus', () => {
  it("status='trialing' ve kalan gün varsa kullanılabilir sayılır (geçer)", () => {
    const result = getSubscriptionStatus({
      status: 'trialing',
      trialEndsAt: '2026-10-20T00:00:00Z',
      currentPeriodEnd: null,
      now: new Date('2026-10-10T00:00:00Z'),
    });
    expect(result.isUsable).toBe(true);
    expect(result.daysRemaining).toBe(10);
    expect(result.label).toBe('Deneme Sürümü');
  });

  it("status='trialing' ve süre dolmuşsa kullanılamaz sayılır (eler)", () => {
    const result = getSubscriptionStatus({
      status: 'trialing',
      trialEndsAt: '2026-10-05T00:00:00Z',
      currentPeriodEnd: null,
      now: new Date('2026-10-10T00:00:00Z'),
    });
    expect(result.isUsable).toBe(false);
    expect(result.daysRemaining).toBe(0);
    expect(result.label).toBe('Deneme Süresi Doldu');
  });

  it("status='active' kullanılabilir sayılır (geçer)", () => {
    const result = getSubscriptionStatus({
      status: 'active',
      trialEndsAt: null,
      currentPeriodEnd: '2026-11-01T00:00:00Z',
      now: new Date('2026-10-10T00:00:00Z'),
    });
    expect(result.isUsable).toBe(true);
    expect(result.label).toBe('Aktif');
  });

  it("status='expired' kullanılamaz sayılır (eler)", () => {
    const result = getSubscriptionStatus({ status: 'expired', trialEndsAt: null, currentPeriodEnd: null });
    expect(result.isUsable).toBe(false);
  });

  it("status='canceled' kullanılamaz sayılır (eler)", () => {
    const result = getSubscriptionStatus({ status: 'canceled', trialEndsAt: null, currentPeriodEnd: null });
    expect(result.isUsable).toBe(false);
  });
});
