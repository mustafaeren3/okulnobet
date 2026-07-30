import { describe, it, expect } from 'vitest';
import { getPricingTier, formatTL } from '@/lib/engine/pricing';

describe('lib/engine/pricing', () => {
  it('0-20 öğretmen: aylık 400, yıllık 2000', () => {
    expect(getPricingTier(0)).toMatchObject({ monthly: 400, yearly: 2000 });
    expect(getPricingTier(20)).toMatchObject({ monthly: 400, yearly: 2000 });
  });

  it('21-40 öğretmen: aylık 800, yıllık 4000', () => {
    expect(getPricingTier(21)).toMatchObject({ monthly: 800, yearly: 4000 });
    expect(getPricingTier(40)).toMatchObject({ monthly: 800, yearly: 4000 });
  });

  it('41-60 öğretmen: aylık 1200, yıllık 6000', () => {
    expect(getPricingTier(41)).toMatchObject({ monthly: 1200, yearly: 6000 });
    expect(getPricingTier(60)).toMatchObject({ monthly: 1200, yearly: 6000 });
  });

  it('61+ öğretmen: aylık 2000, yıllık 10000', () => {
    expect(getPricingTier(61)).toMatchObject({ monthly: 2000, yearly: 10000 });
    expect(getPricingTier(500)).toMatchObject({ monthly: 2000, yearly: 10000 });
  });

  it('geçersiz/negatif değer en düşük kademeye düşer', () => {
    expect(getPricingTier(-5)).toMatchObject({ monthly: 400, yearly: 2000 });
    expect(getPricingTier(undefined)).toMatchObject({ monthly: 400, yearly: 2000 });
  });

  it('formatTL Türkçe binlik ayraçla biçimlendirir', () => {
    expect(formatTL(2000)).toBe('2.000 ₺');
    expect(formatTL(400)).toBe('400 ₺');
  });
});
