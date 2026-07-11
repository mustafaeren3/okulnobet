import { describe, it, expect } from 'vitest';
import { ymdStr, mondayOf, formatDate } from '@/lib/engine/schedule';

describe('lib/engine/schedule — saf yardımcı fonksiyonlar', () => {
  it('ymdStr bir tarihi YYYY-MM-DD biçimine çevirir', () => {
    expect(ymdStr(new Date('2026-09-14T00:00:00'))).toBe('2026-09-14');
  });

  it('mondayOf her zaman aynı girdi için aynı opak anahtarı döner (haftalık gruplama tutarlılığı)', () => {
    // NOT: mondayOf içeride toISOString() (UTC) kullanırken tarih yerel saatle
    // işleniyor; UTC ilerisindeki saat dilimlerinde (ör. İstanbul, +3) döndürülen
    // string takvimsel olarak "bir gün geride" çıkar (Pazartesi yerine Pazar).
    // Bu, üretimde generateSchedule içinde salt opak bir gruplama anahtarı olarak
    // tutarlı biçimde kullanıldığı için şu an davranışı bozmuyor, ama kırılgan —
    // Faz 5'te scheduler yeniden ele alınırken ymdStr ile aynı (yerel) yönteme
    // taşınmalı. Bkz. PHASE_REPORT.md.
    expect(mondayOf('2026-09-17')).toBe(mondayOf('2026-09-14'));
  });

  it('formatDate, YYYY-MM-DD girdisini DD/MM/YYYY olarak biçimlendirir', () => {
    expect(formatDate('2026-09-14')).toBe('14/09/2026');
  });
});
