import { describe, it, expect } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';
import { requireCanGenerateSchedule } from '@/lib/db/subscriptions';

const RUN_ID = Date.now();

// generateBulkSchedule'ın (motor katmanı) geçerli bir abonelikte
// çalıştığını ve BİRDEN FAZLA kez çağrılabildiğini (rotasyon sürekliliği
// için gerekli, bkz. tests/db/bulkSchedule.test.js) kanıtlar.
// requireCanGenerateSchedule (action katmanının kullandığı ücretsiz kota
// kısıtı — Faz 9/Admin v2) AYRI test edilir, motoru bloklamaz.
//
// "Deneme süresi dolmuş bir okulda engellenir" senaryosu otomatik testte
// doğrulanamıyor — subscriptions tablosunda authenticated için sadece
// select izni var (bilinçli, bkz. 0010_subscriptions.sql), bu yüzden test
// istemcisi durumu 'expired' yapamıyor. O senaryo, Supabase CLI ile
// doğrudan SQL üzerinden ve tarayıcıda elle doğrulandı (bkz. PHASE_REPORT.md).

describe('lib/db/bulkSchedule — abonelik kısıtlaması', () => {
  it('free (ücretsiz) bir okulda program üretimi çalışır ve tekrar çağrılabilir (geçer)', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('sub-guard-ok', RUN_ID));
    await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SUBGUARD_OK_T1', branch: 'sınıf' });
    await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_SUBGUARD_OK_ZONE', required_count: 1 });

    const result = await generateBulkSchedule(client, {
      schoolId,
      startDate: '2026-10-06',
      endDate: '2026-10-06',
    });
    expect(result.createdCount).toBe(1);
    expect(result.stats.teacherCount).toBe(1);
    expect(result.stats.zoneCount).toBe(1);
    expect(result.stats.fairnessScore).toBe(100);
    expect(result.months).toEqual([{ key: '2026-10', label: 'Ekim 2026', firstDate: '2026-10-06', lastDate: '2026-10-06' }]);

    // Motor doğrudan tekrar çağrılabilir (rotasyon sürekliliği testleri
    // için gerekli bir yetenek) — ücretsiz kota kısıtı burada uygulanmaz.
    const secondCall = await generateBulkSchedule(client, {
      schoolId,
      startDate: '2026-10-13',
      endDate: '2026-10-13',
    });
    expect(secondCall.createdCount).toBe(1);
  }, 30000);

  it('authenticated kullanıcı kendi subscriptions satırını güncelleyemez (RLS — yazma izni yok, kasıtlı)', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('sub-guard-rls', RUN_ID));

    const { error } = await client.from('subscriptions').update({ status: 'active' }).eq('school_id', schoolId);
    expect(error).not.toBeNull();
  }, 30000);
});

describe('lib/db/subscriptions — requireCanGenerateSchedule (ücretsiz plan sayısal üretim kotası)', () => {
  it('kota dolana kadar izin verir, kota dolunca reddeder (geçer + eler)', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('sub-guard-once', RUN_ID));
    await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SUBGUARD_ONCE_T1', branch: 'sınıf' });
    await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_SUBGUARD_ONCE_ZONE', required_count: 1 });

    await expect(requireCanGenerateSchedule(client, schoolId)).resolves.toBeTruthy();

    // Varsayılan kota 1 — tek gerçek üretimden sonra dolmalı.
    await generateBulkSchedule(client, { schoolId, startDate: '2026-10-06', endDate: '2026-10-06' });

    await expect(requireCanGenerateSchedule(client, schoolId)).rejects.toThrow(/Premium/);
  }, 30000);
});
