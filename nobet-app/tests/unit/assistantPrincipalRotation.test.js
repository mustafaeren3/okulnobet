import { describe, it, expect } from 'vitest';
import {
  buildSequentialAssignments,
  buildWeeklyBlockAssignments,
  buildNDayBlockAssignments,
  computeAssistantPrincipalAssignments,
} from '@/lib/engine/assistantPrincipalRotation';

describe('buildSequentialAssignments', () => {
  it('kişileri gün gün sırayla döndürür (geçer)', () => {
    const result = buildSequentialAssignments(
      ['ali', 'ayse'],
      ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'],
    );
    expect(result.map((r) => r.personId)).toEqual(['ali', 'ayse', 'ali', 'ayse']);
  });

  it('resumeIndex ile kaldığı yerden devam eder (geçer)', () => {
    const result = buildSequentialAssignments(['ali', 'ayse'], ['2026-09-05'], { resumeIndex: 1 });
    expect(result).toEqual([{ personId: 'ayse', date: '2026-09-05' }]);
  });

  it('kişi listesi boşsa hiçbir atama üretmez (eler)', () => {
    expect(buildSequentialAssignments([], ['2026-09-01'])).toEqual([]);
  });

  it('tatil günü zaten dates dışında bırakıldığı için rotasyon sırasını atlamaz (geçer)', () => {
    // 2026-09-02 tatil sayılıp filtrelenmiş varsayılır — dates listesinde hiç yok.
    const result = buildSequentialAssignments(
      ['ali', 'ayse'],
      ['2026-09-01', '2026-09-03'],
    );
    expect(result.map((r) => r.personId)).toEqual(['ali', 'ayse']);
  });
});

describe('buildWeeklyBlockAssignments', () => {
  it('aynı hafta içindeki tüm günlere aynı kişiyi atar (geçer)', () => {
    const result = buildWeeklyBlockAssignments(
      ['ali', 'ayse'],
      ['2026-09-07', '2026-09-08', '2026-09-09'], // Pzt-Çrş aynı hafta
    );
    expect(result.map((r) => r.personId)).toEqual(['ali', 'ali', 'ali']);
  });

  it('sonraki haftada listede bir sonraki kişiye geçer (geçer)', () => {
    const result = buildWeeklyBlockAssignments(
      ['ali', 'ayse'],
      ['2026-09-07', '2026-09-14'], // farklı haftaların Pazartesileri
    );
    expect(result.map((r) => r.personId)).toEqual(['ali', 'ayse']);
  });

  it('tamamı tatil olan bir hafta dates içinde hiç yer almazsa rotasyonu atlamaz (eler — bir sonraki görünen hafta sırayı 1 ilerletir, 2 değil)', () => {
    // 2026-09-14 haftası tamamen tatil varsayılıp filtrelenmiş: dates'te yok.
    const result = buildWeeklyBlockAssignments(
      ['ali', 'ayse', 'veli'],
      ['2026-09-07', '2026-09-21'],
    );
    expect(result.map((r) => r.personId)).toEqual(['ali', 'ayse']);
  });
});

describe('buildNDayBlockAssignments', () => {
  it('her kişi ardışık N günü kapsar (geçer)', () => {
    const result = buildNDayBlockAssignments(
      ['ali', 'ayse'],
      ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'],
      2,
    );
    expect(result.map((r) => r.personId)).toEqual(['ali', 'ali', 'ayse', 'ayse', 'ali']);
  });

  it('resumeDayCount ile blok ortasından devam eder (geçer)', () => {
    const result = buildNDayBlockAssignments(
      ['ali', 'ayse'],
      ['2026-09-03'],
      2,
      { resumeIndex: 0, resumeDayCount: 1 },
    );
    expect(result).toEqual([{ personId: 'ali', date: '2026-09-03' }]);
  });

  it('blockSizeDays 0 veya negatifse 1 gün kabul eder, sonsuz döngüye girmez (eler)', () => {
    const result = buildNDayBlockAssignments(['ali', 'ayse'], ['2026-09-01', '2026-09-02'], 0);
    expect(result.map((r) => r.personId)).toEqual(['ali', 'ayse']);
  });
});

describe('computeAssistantPrincipalAssignments', () => {
  it('mode=sequential_daily doğru üreticiye yönlendirir (geçer)', () => {
    const result = computeAssistantPrincipalAssignments({
      personIds: ['ali', 'ayse'],
      dates: ['2026-09-01', '2026-09-02'],
      mode: 'sequential_daily',
    });
    expect(result.map((r) => r.personId)).toEqual(['ali', 'ayse']);
  });

  it('bilinmeyen mode hata fırlatır (eler)', () => {
    expect(() =>
      computeAssistantPrincipalAssignments({ personIds: ['ali'], dates: ['2026-09-01'], mode: 'gecersiz' }),
    ).toThrow();
  });
});
