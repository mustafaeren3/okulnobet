import { describe, it, expect } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';

const RUN_ID = Date.now();

// generateBulkSchedule'ın, geçerli (trialing) bir abonelikte çalıştığını
// kanıtlar. "Deneme süresi dolmuş bir okulda engellenir" senaryosu
// otomatik testte doğrulanamıyor — subscriptions tablosunda authenticated
// için sadece select izni var (bilinçli, bkz. 0010_subscriptions.sql),
// bu yüzden test istemcisi durumu 'expired' yapamıyor. O senaryo,
// Supabase CLI ile doğrudan SQL üzerinden ve tarayıcıda elle doğrulandı
// (bkz. PHASE_REPORT.md).

describe('lib/db/bulkSchedule — abonelik kısıtlaması', () => {
  it('trialing (geçerli deneme) bir okulda program üretimi çalışır (geçer)', async () => {
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
  }, 30000);

  it('authenticated kullanıcı kendi subscriptions satırını güncelleyemez (RLS — yazma izni yok, kasıtlı)', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('sub-guard-rls', RUN_ID));

    const { error } = await client.from('subscriptions').update({ status: 'active' }).eq('school_id', schoolId);
    expect(error).not.toBeNull();
  }, 30000);
});
