import { describe, it, expect } from 'vitest';
import {
  isPremium,
  canAccessFeature,
  FEATURES,
  buildMonthList,
  getUnlockedMonthKey,
  isMonthUnlocked,
  getMonthKey,
} from '@/lib/engine/access';

describe('isPremium', () => {
  it("status='active' + plan_type='standard' premium sayılır (geçer)", () => {
    expect(isPremium({ status: 'active', plan_type: 'standard' })).toBe(true);
  });

  it("status='active' + plan_type='enterprise' premium sayılır (geçer)", () => {
    expect(isPremium({ status: 'active', plan_type: 'enterprise' })).toBe(true);
  });

  it("status='active' ama plan_type='free' premium SAYILMAZ (eler) — ücretsiz plan artık zaman bazlı bitmediği için 'active' olabiliyor, ama premium değil", () => {
    expect(isPremium({ status: 'active', plan_type: 'free' })).toBe(false);
  });

  it("plan ödemeli olsa bile status='active' değilse premium sayılmaz (eler)", () => {
    expect(isPremium({ status: 'past_due', plan_type: 'standard' })).toBe(false);
  });

  it('abonelik yoksa premium sayılmaz (eler)', () => {
    expect(isPremium(null)).toBe(false);
  });
});

describe('canAccessFeature', () => {
  it('premium okul her özelliğe erişebilir (geçer)', () => {
    expect(canAccessFeature({ status: 'active', plan_type: 'standard' }, FEATURES.EXPORT_PDF)).toBe(true);
  });

  it('ücretsiz okul özelliğe erişemez (eler)', () => {
    expect(canAccessFeature({ status: 'active', plan_type: 'free' }, FEATURES.SHARE_SCHEDULE)).toBe(false);
  });

  it('bilinmeyen özellik adı hata fırlatır (eler)', () => {
    expect(() => canAccessFeature({ status: 'active', plan_type: 'standard' }, 'gecersiz_ozellik')).toThrow();
  });
});

describe('getMonthKey / buildMonthList', () => {
  it("'2026-09-14' için ay anahtarı '2026-09' döner (geçer)", () => {
    expect(getMonthKey('2026-09-14')).toBe('2026-09');
  });

  it('Eylül-Ekim aralığı için 2 ay döner, kısmi sınırlar korunur (geçer)', () => {
    const months = buildMonthList('2026-09-14', '2026-10-20');
    expect(months).toHaveLength(2);
    expect(months[0]).toMatchObject({ key: '2026-09', firstDate: '2026-09-14', lastDate: '2026-09-30' });
    expect(months[1]).toMatchObject({ key: '2026-10', firstDate: '2026-10-01', lastDate: '2026-10-20' });
  });

  it('yıl sınırını aşan aralık (Kasım-Ocak) doğru ay listesi döner (geçer)', () => {
    const months = buildMonthList('2026-11-01', '2027-01-31');
    expect(months.map((m) => m.key)).toEqual(['2026-11', '2026-12', '2027-01']);
  });
});

describe('getUnlockedMonthKey / isMonthUnlocked', () => {
  it('açık ay her zaman aralığın ilk ayıdır (geçer)', () => {
    expect(getUnlockedMonthKey('2026-09-14')).toBe('2026-09');
  });

  it('ücretsiz okulda açık ay eşleşiyorsa açık, eşleşmiyorsa kilitli (geçer + eler)', () => {
    expect(isMonthUnlocked('2026-09', '2026-09', { status: 'active', plan_type: 'free' })).toBe(true);
    expect(isMonthUnlocked('2026-10', '2026-09', { status: 'active', plan_type: 'free' })).toBe(false);
  });

  it('premium okulda açık ay ne olursa olsun tüm aylar açık (geçer)', () => {
    expect(isMonthUnlocked('2026-10', '2026-09', { status: 'active', plan_type: 'standard' })).toBe(true);
    expect(isMonthUnlocked('2026-10', null, { status: 'active', plan_type: 'standard' })).toBe(true);
  });
});
