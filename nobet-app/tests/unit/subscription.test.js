import { describe, it, expect } from 'vitest';
import { getSubscriptionStatus } from '@/lib/engine/subscription';

describe('getSubscriptionStatus', () => {
  it("status='active' kullanılabilir sayılır (geçer)", () => {
    const result = getSubscriptionStatus({
      status: 'active',
      currentPeriodEnd: '2026-11-01T00:00:00Z',
      now: new Date('2026-10-10T00:00:00Z'),
    });
    expect(result.isUsable).toBe(true);
    expect(result.label).toBe('Aktif');
  });

  it("status='past_due' kullanılamaz sayılır (eler)", () => {
    const result = getSubscriptionStatus({ status: 'past_due', currentPeriodEnd: null });
    expect(result.isUsable).toBe(false);
    expect(result.label).toBe('Ödeme Gecikti');
  });

  it("status='expired' kullanılamaz sayılır (eler)", () => {
    const result = getSubscriptionStatus({ status: 'expired', currentPeriodEnd: null });
    expect(result.isUsable).toBe(false);
  });

  it("status='cancelled' kullanılamaz sayılır (eler)", () => {
    const result = getSubscriptionStatus({ status: 'cancelled', currentPeriodEnd: null });
    expect(result.isUsable).toBe(false);
  });

  it("status='frozen' (süper admin dondurmuş) kullanılamaz sayılır (eler)", () => {
    const result = getSubscriptionStatus({ status: 'frozen', currentPeriodEnd: null });
    expect(result.isUsable).toBe(false);
    expect(result.label).toBe('Dondurulmuş (Yönetici)');
  });
});
