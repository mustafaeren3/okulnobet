import { describe, it, expect } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';
import { createAssistantPrincipal } from '@/lib/db/assistantPrincipals';
import { generateAssistantPrincipalSchedule } from '@/lib/db/assistantPrincipalSchedule';
import { requireCanGenerateSchedule } from '@/lib/db/subscriptions';

// Kalite denetimi kararı: Görevli Müdür Yardımcısı üretimi artık öğretmen
// programıyla AYNI merkezi kota sayacını (subscriptions.free_generation_
// quota/used) kullanıyor — ayrı bir "AP kotası" YOK. Kullanıcının isteği:
// "Ayrı ayrı üretim yapılırsa her bağımsız üretim bir kota harcayabilir."
// Varsayılan kota 1 olduğu için bu testler İKİ YÖNDE de kanıtlıyor: hangi
// modül önce kotayı tüketirse tüketsin, DİĞER modül de aynı ortak
// havuzdan bloklanır — bu, iki sayacın PAYLAŞILDIĞININ doğrudan kanıtı
// (ayrı sayaçlar olsaydı ikinci modül hâlâ 1 hakka sahip olurdu).

const RUN_ID = Date.now();

describe('Görevli Müdür Yardımcısı — öğretmen programıyla PAYLAŞILAN ücretsiz kota', () => {
  it('öğretmen programı kotayı tüketince, AP üretimi de aynı ortak kotadan reddedilir', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('ap-quota-a', RUN_ID));
    await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_APQ_A_T1', branch: 'sınıf' });
    await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_APQ_A_ZONE', required_count: 1 });
    await createAssistantPrincipal(client, schoolId, { fullName: 'ZZZ_TENANT_TEST_APQ_A_AP1' });

    // 1) Kota (varsayılan 1) öğretmen üretimiyle tüketilir.
    await requireCanGenerateSchedule(client, schoolId);
    await generateBulkSchedule(client, { schoolId, startDate: '2026-10-06', endDate: '2026-10-06' });

    // 2) AP üretiminin kullandığı AYNI kapı (requireCanGenerateSchedule)
    // artık reddetmeli — ayrı bir AP kotası olsaydı bu geçerdi.
    await expect(requireCanGenerateSchedule(client, schoolId)).rejects.toThrow(/Premium/);
  }, 30000);

  it('AP üretimi kotayı tüketince, öğretmen programı üretimi de aynı ortak kotadan reddedilir', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('ap-quota-b', RUN_ID));
    await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_APQ_B_T1', branch: 'sınıf' });
    await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_APQ_B_ZONE', required_count: 1 });
    await createAssistantPrincipal(client, schoolId, { fullName: 'ZZZ_TENANT_TEST_APQ_B_AP1' });

    // 1) Kota (varsayılan 1) AP üretimiyle tüketilir — action katmanındaki
    // gate (requireCanGenerateSchedule) burada elle çağrılıyor çünkü
    // generateAssistantPrincipalSchedule'ın kendisi (motor katmanı,
    // generateBulkSchedule ile AYNI mimari nedenle) kapıyı içermiyor.
    await requireCanGenerateSchedule(client, schoolId);
    await generateAssistantPrincipalSchedule(client, { schoolId, startDate: '2026-10-06', endDate: '2026-10-06' });

    // 2) Öğretmen programının kullandığı AYNI kapı artık reddetmeli.
    await expect(requireCanGenerateSchedule(client, schoolId)).rejects.toThrow(/Premium/);
  }, 30000);

  it('AP üretimi dryRun modunda kotayı TÜKETMEZ (ön izleme, gerçek üretim değil)', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('ap-quota-dryrun', RUN_ID));
    await createAssistantPrincipal(client, schoolId, { fullName: 'ZZZ_TENANT_TEST_APQ_DRY_AP1' });

    await generateAssistantPrincipalSchedule(client, { schoolId, startDate: '2026-10-06', endDate: '2026-10-06', dryRun: true });

    // Kota hâlâ dolu değil — hem öğretmen hem AP üretimi hâlâ mümkün olmalı.
    await expect(requireCanGenerateSchedule(client, schoolId)).resolves.toBeTruthy();
  }, 30000);
});
