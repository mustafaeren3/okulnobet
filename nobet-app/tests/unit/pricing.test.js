import { describe, it, expect } from 'vitest';
import { STANDARD_YEARLY_PRICE, formatTL } from '@/lib/engine/pricing';

describe('lib/engine/pricing', () => {
  it('Standart plan sabit fiyat: 1.490 TL/yıl (geçer)', () => {
    expect(STANDARD_YEARLY_PRICE).toBe(1490);
  });

  it('formatTL Türkçe binlik ayraçla biçimlendirir (geçer)', () => {
    expect(formatTL(1490)).toBe('1.490 ₺');
    expect(formatTL(400)).toBe('400 ₺');
  });
});
