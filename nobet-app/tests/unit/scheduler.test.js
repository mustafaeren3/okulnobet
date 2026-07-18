import { describe, it, expect } from 'vitest';
import { eachDateStr, isSchedulableDay } from '@/lib/engine/scheduler';

describe('eachDateStr', () => {
  it('aynı gün start/end verilirse tek elemanlı dizi döndürür', () => {
    expect(eachDateStr('2026-10-06', '2026-10-06')).toEqual(['2026-10-06']);
  });

  it('bir haftalık aralığı doğru üretir', () => {
    const dates = eachDateStr('2026-10-06', '2026-10-10');
    expect(dates).toEqual(['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);
  });

  it('ay sınırını doğru geçer', () => {
    const dates = eachDateStr('2026-10-30', '2026-11-02');
    expect(dates).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('yıl sınırını doğru geçer', () => {
    const dates = eachDateStr('2026-12-30', '2027-01-02');
    expect(dates).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  });
});

describe('isSchedulableDay', () => {
  it('hafta içi + tatil kaydı yoksa çalışılabilir gün (geçer)', () => {
    expect(isSchedulableDay({ weekday: 2, calendarDay: undefined })).toBe(true);
  });

  it('Cumartesi (6) çalışılamaz gün (eler)', () => {
    expect(isSchedulableDay({ weekday: 6, calendarDay: undefined })).toBe(false);
  });

  it('Pazar (0) çalışılamaz gün (eler)', () => {
    expect(isSchedulableDay({ weekday: 0, calendarDay: undefined })).toBe(false);
  });

  it("day_type='holiday' olan hafta içi günü çalışılamaz sayar (eler)", () => {
    expect(isSchedulableDay({ weekday: 3, calendarDay: { day_type: 'holiday' } })).toBe(false);
  });

  it("day_type='half_day' olan gün hâlâ çalışılabilir sayılır (geçer)", () => {
    expect(isSchedulableDay({ weekday: 3, calendarDay: { day_type: 'half_day' } })).toBe(true);
  });

  it("day_type='ceremony' olan gün hâlâ çalışılabilir sayılır (geçer)", () => {
    expect(isSchedulableDay({ weekday: 3, calendarDay: { day_type: 'ceremony' } })).toBe(true);
  });
});
