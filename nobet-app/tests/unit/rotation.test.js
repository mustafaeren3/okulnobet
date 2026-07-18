import { describe, it, expect } from 'vitest';
import { getWeekStart, groupDatesByWeek, getZoneForCursor } from '@/lib/engine/rotation';

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

describe('groupDatesByWeek', () => {
  it('tek haftalık bir aralığı tek grup olarak döndürür (geçer)', () => {
    const dates = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];
    const weeks = groupDatesByWeek(dates);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].weekStart).toBe('2026-10-05');
    expect(weeks[0].dates).toEqual(dates);
  });

  it('iki haftaya yayılan bir aralığı iki gruba ayırır (eler — tek grup değil)', () => {
    const dates = ['2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13'];
    const weeks = groupDatesByWeek(dates);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].weekStart).toBe('2026-10-05');
    expect(weeks[0].dates).toEqual(['2026-10-08', '2026-10-09']);
    expect(weeks[1].weekStart).toBe('2026-10-12');
    expect(weeks[1].dates).toEqual(['2026-10-12', '2026-10-13']);
  });
});

describe('getZoneForCursor', () => {
  it('cursor liste sınırları içindeyse doğrudan o index\'i döndürür (geçer)', () => {
    expect(getZoneForCursor(['a', 'b', 'c'], 1)).toBe('b');
  });

  it('cursor liste uzunluğunu aşarsa başa sarar (eler — sınır dışı değil)', () => {
    expect(getZoneForCursor(['a', 'b', 'c'], 3)).toBe('a');
    expect(getZoneForCursor(['a', 'b', 'c'], 4)).toBe('b');
  });

  it('boş liste için null döndürür', () => {
    expect(getZoneForCursor([], 0)).toBeNull();
  });
});
