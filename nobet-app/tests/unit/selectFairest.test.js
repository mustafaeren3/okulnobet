import { describe, it, expect } from 'vitest';
import { selectFairest } from '@/lib/engine/selectFairest';

function candidate(name, dutyCount) {
  return { teacher: { full_name: name }, dutyCount };
}

describe('selectFairest', () => {
  it('en az nöbet tutanları seçer (geçer)', () => {
    const candidates = [candidate('CEM', 5), candidate('AYŞE', 1), candidate('BURAK', 3)];
    const selected = selectFairest(candidates, 2);
    expect(selected.map((c) => c.teacher.full_name)).toEqual(['AYŞE', 'BURAK']);
  });

  it('requiredCount aday sayısından fazlaysa tüm adayları döndürür (geçer)', () => {
    const candidates = [candidate('AYŞE', 1), candidate('BURAK', 3)];
    const selected = selectFairest(candidates, 5);
    expect(selected).toHaveLength(2);
  });

  it('eşit dutyCount durumunda isim sırasına göre deterministik seçer (eler — CEM değil AYŞE)', () => {
    const candidates = [candidate('CEM', 2), candidate('AYŞE', 2), candidate('BURAK', 2)];
    const selected = selectFairest(candidates, 1);
    expect(selected[0].teacher.full_name).toBe('AYŞE');
  });

  it('boş aday listesinde boş dizi döndürür (eler)', () => {
    expect(selectFairest([], 3)).toEqual([]);
  });

  it('orijinal diziyi mutasyona uğratmaz', () => {
    const candidates = [candidate('CEM', 5), candidate('AYŞE', 1)];
    const original = [...candidates];
    selectFairest(candidates, 1);
    expect(candidates).toEqual(original);
  });
});
