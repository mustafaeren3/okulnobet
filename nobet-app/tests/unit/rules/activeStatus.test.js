import { describe, it, expect } from 'vitest';
import { checkActiveStatus } from '@/lib/engine/rules/activeStatus';

describe('checkActiveStatus', () => {
  it('aktif öğretmen + aktif bölge uygun (geçer)', () => {
    const result = checkActiveStatus({ teacher: { is_active: true }, zone: { is_active: true } });
    expect(result.eligible).toBe(true);
  });

  it('pasif öğretmen uygun değil (eler)', () => {
    const result = checkActiveStatus({ teacher: { is_active: false }, zone: { is_active: true } });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('teacher_inactive');
  });

  it('pasif bölge uygun değil (eler)', () => {
    const result = checkActiveStatus({ teacher: { is_active: true }, zone: { is_active: false } });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('zone_inactive');
  });
});
