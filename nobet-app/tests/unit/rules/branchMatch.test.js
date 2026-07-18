import { describe, it, expect } from 'vitest';
import { checkBranchMatch } from '@/lib/engine/rules/branchMatch';

describe('checkBranchMatch', () => {
  it('allowed_branches boşsa (null) her branş uygun (geçer)', () => {
    const result = checkBranchMatch({
      teacher: { branch: 'müzik' },
      zone: { allowed_branches: null, blocked_branches: null },
    });
    expect(result.eligible).toBe(true);
  });

  it('branş allowed_branches listesindeyse uygun (geçer)', () => {
    const result = checkBranchMatch({
      teacher: { branch: 'sınıf' },
      zone: { allowed_branches: ['sınıf', 'beden eğitimi'], blocked_branches: null },
    });
    expect(result.eligible).toBe(true);
  });

  it('branş allowed_branches listesinde değilse uygun değil (eler)', () => {
    const result = checkBranchMatch({
      teacher: { branch: 'müzik' },
      zone: { allowed_branches: ['sınıf', 'beden eğitimi'], blocked_branches: null },
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('branch_not_allowed');
  });

  it('branş blocked_branches listesindeyse uygun değil (eler)', () => {
    const result = checkBranchMatch({
      teacher: { branch: 'okul öncesi' },
      zone: { allowed_branches: null, blocked_branches: ['okul öncesi'] },
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('branch_blocked');
  });

  it('Türkçe büyük/küçük harf farkına rağmen doğru eşleşir (SINIF ↔ sınıf)', () => {
    const result = checkBranchMatch({
      teacher: { branch: 'SINIF' },
      zone: { allowed_branches: ['sınıf'], blocked_branches: null },
    });
    expect(result.eligible).toBe(true);
  });
});
