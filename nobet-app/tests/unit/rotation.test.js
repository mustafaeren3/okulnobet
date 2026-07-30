import { describe, it, expect } from 'vitest';
import {
  getWeekStart,
  addDays,
  weeksBetween,
  shiftLayout,
  emptyWeekGrid,
  advanceWeekGrid,
  advanceMonthGrid,
} from '@/lib/engine/rotation';

describe('getWeekStart', () => {
  it('Salı tarihi için o haftanın Pazartesi\'sini döndürür (geçer)', () => {
    // 2026-10-06 Salı → 2026-10-05 Pazartesi.
    expect(getWeekStart('2026-10-06')).toBe('2026-10-05');
  });

  it('Pazartesi tarihi kendisini döndürür (geçer)', () => {
    expect(getWeekStart('2026-10-05')).toBe('2026-10-05');
  });

  it('Pazar tarihi için önceki Pazartesi\'yi döndürür (eler — bir sonraki hafta değil)', () => {
    // 2026-10-11 Pazar → 2026-10-05 Pazartesi.
    expect(getWeekStart('2026-10-11')).toBe('2026-10-05');
  });

  it('ay sınırını doğru geçer', () => {
    // 2026-11-02 Pazartesi.
    expect(getWeekStart('2026-11-02')).toBe('2026-11-02');
  });
});

describe('addDays', () => {
  it('pozitif gün ekler, ay sınırını geçer', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
  });

  it('negatif gün çıkarır (önceki haftanın aralığı için)', () => {
    expect(addDays('2026-10-05', -7)).toBe('2026-09-28');
    expect(addDays('2026-10-05', -1)).toBe('2026-10-04');
  });
});

describe('weeksBetween', () => {
  it('ardışık hafta başlangıçları için 1 döndürür (geçer)', () => {
    expect(weeksBetween('2026-10-12', '2026-10-05')).toBe(1);
  });

  it('aynı hafta için 0, iki hafta arayla 2 döndürür', () => {
    expect(weeksBetween('2026-10-05', '2026-10-05')).toBe(0);
    expect(weeksBetween('2026-10-19', '2026-10-05')).toBe(2);
  });
});

describe('shiftLayout', () => {
  // layout: [zoneIndex] = teacherId[] — her ekip k bölge İLERİ gider.
  it('k=1: her ekip bir sonraki bölgeye kayar, sondaki başa döner (geçer)', () => {
    const layout = [['t1'], ['t2'], ['t3']];
    expect(shiftLayout(layout, 1)).toEqual([['t3'], ['t1'], ['t2']]);
  });

  it('k=2 iki bölge kaydırır; k=bölge sayısı tam tur olup aynı düzeni verir (eler — fazla kaymaz)', () => {
    const layout = [['t1'], ['t2'], ['t3']];
    expect(shiftLayout(layout, 2)).toEqual([['t2'], ['t3'], ['t1']]);
    expect(shiftLayout(layout, 3)).toEqual(layout);
  });

  it('k=0 düzeni değiştirmez, boş liste boş döner', () => {
    const layout = [['t1'], ['t2']];
    expect(shiftLayout(layout, 0)).toEqual(layout);
    expect(shiftLayout([], 5)).toEqual([]);
  });
});

describe('advanceWeekGrid — haftalik_yer adımı (bölge +1, sarınca gün +1)', () => {
  it('bölge listesi sarmayan öğretmen aynı günde bir sonraki bölgeye gider (geçer)', () => {
    const grid = emptyWeekGrid(2);
    grid[1] = [['t1'], ['t2']]; // Pazartesi: z0=t1, z1=t2
    const next = advanceWeekGrid(grid, 2);
    expect(next[1][1]).toEqual(['t1']); // t1: Pzt z0 → Pzt z1
  });

  it('günün SON bölgesindeki öğretmen bir sonraki GÜNÜN İLK bölgesine geçer (kullanıcının 5. hafta örneği)', () => {
    const grid = emptyWeekGrid(2);
    grid[1] = [['t1'], ['t2']];
    const next = advanceWeekGrid(grid, 2);
    expect(next[2][0]).toEqual(['t2']); // t2: Pzt z-son → Salı z0
  });

  it('Cuma son bölgedeki öğretmen Pazartesi ilk bölgeye sarar (eler — döngü kopmaz)', () => {
    const grid = emptyWeekGrid(3);
    grid[5] = [[], [], ['t9']]; // Cuma son bölge
    const next = advanceWeekGrid(grid, 3);
    expect(next[1][0]).toEqual(['t9']);
  });
});

describe('advanceMonthGrid — aylık adımlar', () => {
  it('aylik_ayni_gun: bölge +1, gün SABİT (geçer)', () => {
    const grid = emptyWeekGrid(2);
    grid[1] = [['t1'], ['t2']];
    grid[3] = [['t3'], ['t4']];
    const next = advanceMonthGrid(grid, 2, { shiftDay: false });
    expect(next[1]).toEqual([['t2'], ['t1']]); // Pazartesi ekibi Pazartesi'de kaldı
    expect(next[3]).toEqual([['t4'], ['t3']]);
  });

  it('aylik_farkli_gun: bölge +1 VE gün +1 — Pazartesi ekibi Salı\'ya geçer (geçer)', () => {
    const grid = emptyWeekGrid(2);
    grid[1] = [['t1'], ['t2']]; // Pazartesi: t1 zemin → beklenen: Salı 1.kat
    const next = advanceMonthGrid(grid, 2, { shiftDay: true });
    expect(next[2]).toEqual([['t2'], ['t1']]); // Salı: t1 artık z1'de
  });

  it('aylik_farkli_gun: Cuma ekibi Pazartesi\'ye sarar (eler — gün döngüsü kopmaz)', () => {
    const grid = emptyWeekGrid(2);
    grid[5] = [['t1'], ['t2']];
    const next = advanceMonthGrid(grid, 2, { shiftDay: true });
    expect(next[1]).toEqual([['t2'], ['t1']]);
  });
});
