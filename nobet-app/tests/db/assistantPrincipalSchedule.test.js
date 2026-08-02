import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createAssistantPrincipal } from '@/lib/db/assistantPrincipals';
import { setRotationSettings } from '@/lib/db/assistantPrincipalRotationSettings';
import { generateAssistantPrincipalSchedule } from '@/lib/db/assistantPrincipalSchedule';

// generateAssistantPrincipalSchedule'ın gerçek Supabase verisiyle uçtan uca
// doğru çalıştığını kanıtlar: hafta sonu/tatil atlama, sıralı dönüşüm,
// çapadan devam (rotasyon sırası kaybolmadan ikinci bir üretim turu).

const RUN_ID = Date.now();
// 2026-11-02 Pazartesi ... 2026-11-06 Cuma (5 hafta içi gün, hafta sonu yok).
const START = '2026-11-02';
const END = '2026-11-06';

async function fetchAssignments(client, schoolId) {
  const { data, error } = await client
    .from('assistant_principal_assignments')
    .select('duty_date, assistant_principal_id')
    .eq('school_id', schoolId)
    .order('duty_date');
  if (error) throw new Error(error.message);
  return data;
}

describe('lib/db/assistantPrincipalSchedule — generateAssistantPrincipalSchedule', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('ap-sched', RUN_ID));
  }, 30000);

  it('sequential_daily: hafta içi her güne sırayla bir kişi atar, hafta sonunu atlar', async () => {
    const ali = await createAssistantPrincipal(client, schoolId, { fullName: 'ZZZ_TENANT_TEST_AP_SCHED_ALI' });
    const ayse = await createAssistantPrincipal(client, schoolId, { fullName: 'ZZZ_TENANT_TEST_AP_SCHED_AYSE' });
    await setRotationSettings(client, schoolId, { mode: 'sequential_daily', blockSizeDays: null });

    const result = await generateAssistantPrincipalSchedule(client, { schoolId, startDate: START, endDate: END });
    expect(result.createdCount).toBe(5);

    const rows = await fetchAssignments(client, schoolId);
    const dates = rows.map((r) => r.duty_date);
    expect(dates).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']);
    expect(rows.map((r) => r.assistant_principal_id)).toEqual([ali.id, ayse.id, ali.id, ayse.id, ali.id]);
  }, 30000);

  it('resmi tatil olarak işaretlenen günü atlar', async () => {
    const school2 = await signUpAndRegisterSchool(client, makeTestUser('ap-sched-holiday', RUN_ID));
    await createAssistantPrincipal(client, school2, { fullName: 'ZZZ_TENANT_TEST_AP_SCHED_HOL_1' });
    await createAssistantPrincipal(client, school2, { fullName: 'ZZZ_TENANT_TEST_AP_SCHED_HOL_2' });
    await setRotationSettings(client, school2, { mode: 'sequential_daily', blockSizeDays: null });

    const { error: calError } = await client
      .from('calendar_days')
      .insert({ school_id: school2, calendar_date: '2026-11-04', day_type: 'holiday', description: 'Test Tatili' });
    if (calError) throw new Error(calError.message);

    await generateAssistantPrincipalSchedule(client, { schoolId: school2, startDate: START, endDate: END });

    const rows = await fetchAssignments(client, school2);
    const dates = rows.map((r) => r.duty_date);
    expect(dates).toEqual(['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06']);
  }, 30000);

  it('ikinci üretim turu, birinci turun bıraktığı yerden rotasyona devam eder (çapadan devam)', async () => {
    const school3 = await signUpAndRegisterSchool(client, makeTestUser('ap-sched-resume', RUN_ID));
    const ali = await createAssistantPrincipal(client, school3, { fullName: 'ZZZ_TENANT_TEST_AP_SCHED_RES_ALI' });
    const ayse = await createAssistantPrincipal(client, school3, { fullName: 'ZZZ_TENANT_TEST_AP_SCHED_RES_AYSE' });
    await setRotationSettings(client, school3, { mode: 'sequential_daily', blockSizeDays: null });

    // 1. tur: Pzt-Sal (2 gün) — Ali, Ayşe.
    await generateAssistantPrincipalSchedule(client, { schoolId: school3, startDate: '2026-11-02', endDate: '2026-11-03' });
    // 2. tur: Çrş-Cum (3 gün) — sıra Ali'den devam etmeli (Sal Ayşe'deydi).
    await generateAssistantPrincipalSchedule(client, { schoolId: school3, startDate: '2026-11-04', endDate: '2026-11-06' });

    const rows = await fetchAssignments(client, school3);
    expect(rows.map((r) => r.assistant_principal_id)).toEqual([ali.id, ayse.id, ali.id, ayse.id, ali.id]);
  }, 30000);

  it('n_day_block: her kişi ardışık blok boyunca görevli kalır, dryRun DB\'ye yazmaz', async () => {
    const school4 = await signUpAndRegisterSchool(client, makeTestUser('ap-sched-block', RUN_ID));
    const ali = await createAssistantPrincipal(client, school4, { fullName: 'ZZZ_TENANT_TEST_AP_SCHED_BLK_ALI' });
    await createAssistantPrincipal(client, school4, { fullName: 'ZZZ_TENANT_TEST_AP_SCHED_BLK_AYSE' });
    await setRotationSettings(client, school4, { mode: 'n_day_block', blockSizeDays: 3 });

    const dryResult = await generateAssistantPrincipalSchedule(client, { schoolId: school4, startDate: START, endDate: END, dryRun: true });
    expect(dryResult.createdCount).toBe(5);
    expect(await fetchAssignments(client, school4)).toHaveLength(0);

    await generateAssistantPrincipalSchedule(client, { schoolId: school4, startDate: START, endDate: END });
    const rows = await fetchAssignments(client, school4);
    expect(rows.map((r) => r.assistant_principal_id)).toEqual([ali.id, ali.id, ali.id, rows[3].assistant_principal_id, rows[3].assistant_principal_id]);
    expect(rows[3].assistant_principal_id).not.toBe(ali.id);
  }, 30000);
});
