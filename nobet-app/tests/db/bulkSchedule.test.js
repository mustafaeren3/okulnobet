import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';
import { setSchoolRotationMode } from '@/lib/db/schoolContext';
import { setUnavailableWeekdays } from '@/lib/db/teacherAvailability';

// generateBulkSchedule'ın gerçek Supabase verisiyle uçtan uca doğru
// çalıştığını kanıtlar: hafta sonu/tatil atlama, aynı gün çift atama
// olmaması, idempotency, adil dağılım.

const RUN_ID = Date.now();
// 2026-10-05 Pazartesi ... 2026-10-11 Pazar (5 hafta içi + 2 hafta sonu günü).
const START = '2026-10-05';
const END = '2026-10-11';

async function countAssignments(client, zoneId) {
  const { data, error } = await client.from('duty_assignments').select('duty_date, teacher_id').eq('zone_id', zoneId);
  if (error) throw new Error(error.message);
  return data;
}

describe('lib/db/bulkSchedule — generateBulkSchedule', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('bulk', RUN_ID));
  }, 30000);

  it('hafta sonlarını atlar, sadece hafta içi günlerde atama üretir', async () => {
    // Haftalık nöbet limiti (max_duty_per_week) çift-nöbetsiz bir
    // öğretmenin haftada 1 nöbetle sınırlı olmasını gerektirir — 5 hafta
    // içi günü kanıtlamak için 5 öğretmen (biri/gün) kullanılıyor.
    const ts = [];
    for (const n of ['T1', 'T2', 'T3', 'T4', 'T5']) {
      ts.push(await createTeacher(client, schoolId, { full_name: `ZZZ_TENANT_TEST_BULK_${n}`, branch: 'sınıf' }));
    }
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_BULK_ZONE_1', required_count: 1 });

    const result = await generateBulkSchedule(client, { schoolId, startDate: START, endDate: END });
    expect(result.createdCount).toBeGreaterThanOrEqual(5); // en az bu zone için 5 hafta içi gün

    const rows = await countAssignments(client, zone.id);
    expect(rows).toHaveLength(5);
    const dates = rows.map((r) => r.duty_date).sort();
    expect(dates).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
    void ts;
  }, 30000);

  it('resmi tatil olarak işaretlenen günü atlar', async () => {
    const school2 = await signUpAndRegisterSchool(client, makeTestUser('bulk-holiday', RUN_ID));
    // 4 hafta içi gün tatil DIŞINDA kalıyor (10-07 tatil) — haftalık
    // limit yüzünden 4 farklı öğretmen gerekiyor.
    for (const n of ['T1', 'T2', 'T3', 'T4']) {
      await createTeacher(client, school2, { full_name: `ZZZ_TENANT_TEST_BULK_HOL_${n}`, branch: 'sınıf' });
    }
    const zone = await createDutyZone(client, school2, { name: 'ZZZ_TENANT_TEST_BULK_HOL_ZONE', required_count: 1 });

    const { error: calError } = await client
      .from('calendar_days')
      .insert({ school_id: school2, calendar_date: '2026-10-07', day_type: 'holiday', description: 'Test Tatili' });
    if (calError) throw new Error(calError.message);

    await generateBulkSchedule(client, { schoolId: school2, startDate: START, endDate: END });

    const rows = await countAssignments(client, zone.id);
    const dates = rows.map((r) => r.duty_date).sort();
    expect(dates).toEqual(['2026-10-05', '2026-10-06', '2026-10-08', '2026-10-09']);
  }, 30000);

  it('tek öğretmen + iki bölge: aynı günde çift atama yapmaz (double duty izni yok)', async () => {
    const school3 = await signUpAndRegisterSchool(client, makeTestUser('bulk-double', RUN_ID));
    const teacher = await createTeacher(client, school3, {
      full_name: 'ZZZ_TENANT_TEST_BULK_DBL_T1',
      branch: 'sınıf',
      allow_double_duty: false,
    });
    const zoneA = await createDutyZone(client, school3, { name: 'ZZZ_TENANT_TEST_BULK_DBL_ZONE_A', required_count: 1 });
    const zoneB = await createDutyZone(client, school3, { name: 'ZZZ_TENANT_TEST_BULK_DBL_ZONE_B', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school3, startDate: '2026-10-06', endDate: '2026-10-06' });

    const rowsA = await countAssignments(client, zoneA.id);
    const rowsB = await countAssignments(client, zoneB.id);
    const total = rowsA.length + rowsB.length;

    expect(total).toBe(1); // iki bölge de required_count=1 istiyor ama tek öğretmen var, sadece biri dolar
    if (rowsA.length) expect(rowsA[0].teacher_id).toBe(teacher.id);
    if (rowsB.length) expect(rowsB[0].teacher_id).toBe(teacher.id);
  }, 30000);

  it('iki kez çalıştırınca eski otomatik atamalar silinip yeniden üretilir (idempotency)', async () => {
    const school4 = await signUpAndRegisterSchool(client, makeTestUser('bulk-idem', RUN_ID));
    await createTeacher(client, school4, { full_name: 'ZZZ_TENANT_TEST_BULK_IDEM_T1', branch: 'sınıf' });
    const zone = await createDutyZone(client, school4, { name: 'ZZZ_TENANT_TEST_BULK_IDEM_ZONE', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school4, startDate: START, endDate: END });
    const firstRun = await countAssignments(client, zone.id);

    await generateBulkSchedule(client, { schoolId: school4, startDate: START, endDate: END });
    const secondRun = await countAssignments(client, zone.id);

    expect(secondRun).toHaveLength(firstRun.length);
  }, 30000);

  it('yetersiz öğretmen: çift nöbet işaretlenmemiş öğretmen haftalık hakkı dolunca kalan hücreler BOŞ kalır', async () => {
    // Kullanıcının tarifi: "17 öğretmen var, 20 farklı yer var, 3 kişinin
    // çift nöbet tutması gerekiyor; işaretlemezsem o 3 yeri boş bırak."
    // Küçültülmüş model: 2 öğretmen (ikisi de çift nöbetsiz), 5 hafta
    // içi gün — her biri haftada sadece 1 nöbet tutabilir, toplam kapasite
    // 2, geri kalan 3 gün BOŞ kalmalı (birine zorla ikinci nöbet verilmez).
    const school5 = await signUpAndRegisterSchool(client, makeTestUser('bulk-fair', RUN_ID));
    const teacherA = await createTeacher(client, school5, { full_name: 'ZZZ_TENANT_TEST_BULK_FAIR_A', branch: 'sınıf', allow_double_duty: false });
    const teacherB = await createTeacher(client, school5, { full_name: 'ZZZ_TENANT_TEST_BULK_FAIR_B', branch: 'sınıf', allow_double_duty: false });
    const zone = await createDutyZone(client, school5, { name: 'ZZZ_TENANT_TEST_BULK_FAIR_ZONE', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school5, startDate: START, endDate: END });

    const rows = await countAssignments(client, zone.id);
    const countA = rows.filter((r) => r.teacher_id === teacherA.id).length;
    const countB = rows.filter((r) => r.teacher_id === teacherB.id).length;

    expect(rows).toHaveLength(2); // 5 değil — kalan 3 gün boş kalmalı
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  }, 30000);

  it('yeterli olsa bile çift nöbet işaretlenirse haftada 2. nöbet alabilir', async () => {
    // Aynı kıtlık senaryosu ama teacherA çift nöbete işaretli: artık
    // haftada 2 nöbet tutabilir, 5 günün hepsi dolar (A: 2, B: kalan 3'ten
    // sadece 1'i — B de çift nöbetsiz olduğu için haftada 1 ile sınırlı;
    // toplamda 3 gün dolar, 2 gün hâlâ boş — kapasite hâlâ tam yetmiyor
    // ama A'nın çift nöbeti sayesinde bir gün daha dolmuş oluyor).
    const school5b = await signUpAndRegisterSchool(client, makeTestUser('bulk-fair-dbl', RUN_ID));
    const teacherA = await createTeacher(client, school5b, { full_name: 'ZZZ_TENANT_TEST_BULK_FAIRDBL_A', branch: 'sınıf', allow_double_duty: true });
    const teacherB = await createTeacher(client, school5b, { full_name: 'ZZZ_TENANT_TEST_BULK_FAIRDBL_B', branch: 'sınıf', allow_double_duty: false });
    const zone = await createDutyZone(client, school5b, { name: 'ZZZ_TENANT_TEST_BULK_FAIRDBL_ZONE', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school5b, startDate: START, endDate: END });

    const rows = await countAssignments(client, zone.id);
    const countA = rows.filter((r) => r.teacher_id === teacherA.id).length;
    const countB = rows.filter((r) => r.teacher_id === teacherB.id).length;

    expect(rows).toHaveLength(3);
    expect(countA).toBe(2); // çift nöbet: haftada en fazla 2
    expect(countB).toBe(1);
  }, 30000);

  it('elle önceden doldurulmuş bir gün+bölgeye fazladan otomatik atama eklemez (required_count aşılmaz)', async () => {
    const school6 = await signUpAndRegisterSchool(client, makeTestUser('bulk-manual', RUN_ID));
    const manualTeacher = await createTeacher(client, school6, { full_name: 'ZZZ_TENANT_TEST_BULK_MANUAL_T1', branch: 'sınıf' });
    // Kalan 4 hafta içi günü (10-05, 07, 08, 09) haftalık limite takılmadan
    // dolduracak kadar taze öğretmen (manualTeacher'ın haftalık hakkı
    // elle atamayla zaten dolu, otomatik doldurmaya katılamaz).
    for (const n of ['T2', 'T3', 'T4', 'T5']) {
      await createTeacher(client, school6, { full_name: `ZZZ_TENANT_TEST_BULK_MANUAL_${n}`, branch: 'sınıf' });
    }
    const zone = await createDutyZone(client, school6, { name: 'ZZZ_TENANT_TEST_BULK_MANUAL_ZONE', required_count: 1 });

    // 2026-10-06 için elle bir atama zaten var (is_manual=true).
    const { error } = await client.from('duty_assignments').insert({
      school_id: school6,
      teacher_id: manualTeacher.id,
      zone_id: zone.id,
      duty_date: '2026-10-06',
      is_manual: true,
    });
    if (error) throw new Error(error.message);

    await generateBulkSchedule(client, { schoolId: school6, startDate: START, endDate: END });

    const rows = await countAssignments(client, zone.id);
    const oct06Rows = rows.filter((r) => r.duty_date === '2026-10-06');
    expect(oct06Rows).toHaveLength(1); // required_count=1 zaten elle dolu, motor ikinci bir kişi eklememeli
    expect(oct06Rows[0].teacher_id).toBe(manualTeacher.id);

    // Diğer hafta içi günler (10-05, 07, 08, 09) hâlâ otomatik dolduruldu.
    expect(rows).toHaveLength(5);
  }, 30000);

  it('yeterli öğretmen varken hiç kimse aynı hafta içinde iki kez nöbet tutmaz (çift nöbet işaretli olmasa da)', async () => {
    // Kullanıcı raporu: haftalık yer değişiminde bazı öğretmenler çift
    // nöbet işaretli olmadığı halde aynı hafta içinde iki kez nöbete
    // giriyordu. 5 öğretmen + 1 bölge + 5 hafta içi gün: tam olarak
    // herkese bir gün düşecek kadar öğretmen var, kimse tekrar etmemeli.
    const school13 = await signUpAndRegisterSchool(client, makeTestUser('bulk-noweekdup', RUN_ID));
    const ts = [];
    for (const n of ['T1', 'T2', 'T3', 'T4', 'T5']) {
      ts.push(await createTeacher(client, school13, {
        full_name: `ZZZ_TENANT_TEST_NODUP_${n}`,
        branch: 'sınıf',
        allow_double_duty: false,
      }));
    }
    const zone = await createDutyZone(client, school13, { name: 'ZZZ_TENANT_TEST_NODUP_ZONE', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school13, startDate: START, endDate: END });

    const rows = await countAssignments(client, zone.id);
    expect(rows).toHaveLength(5);
    const teacherIdsUsed = rows.map((r) => r.teacher_id);
    expect(new Set(teacherIdsUsed).size).toBe(5); // her öğretmen tam olarak bir kez
    void ts;
  }, 30000);

  it('gün kısıtlı (sadece belirli gün) öğretmen HER hafta kendi gününü alır, desene katılıp kaybolmaz', async () => {
    // Kullanıcı raporu: "bir öğretmen sadece çarşamba nöbet tutabilir
    // yaptığımda onu her çarşambaya vermiyor." Kök neden: haftalik_yer'in
    // gün-öncelikli tek döngüsü kısıtlı bir öğretmeni desene alıp er ya
    // da geç müsait olmadığı bir güne kaydırıyordu, orada kalıcı olarak
    // elenip haftalarca (döngü tekrar çarşambaya gelene kadar) hiç
    // atanamıyordu. Artık kısıtlı öğretmenler desene hiç katılmıyor,
    // bunun yerine kendi müsait gününde HER hafta önceliklidir.
    const school15 = await signUpAndRegisterSchool(client, makeTestUser('bulk-restricted', RUN_ID));
    const wed = await createTeacher(client, school15, {
      full_name: 'ZZZ_TENANT_TEST_RESTRICT_WED',
      branch: 'sınıf',
      restriction_mode: 'ONLY',
    });
    await setUnavailableWeekdays(client, school15, wed.id, [3]); // sadece Çarşamba
    // Diğer hafta içi günleri dolduracak yeterli (kısıtsız) öğretmen —
    // aksi halde haftalık sıralı yer değişimi testinde kanıtlandığı gibi
    // boş günler döngüyü bozar (tek bölge burada zoneCount=1, gün her
    // hafta ilerler — 5 kısıtsız öğretmen her gün için bir tane yeter).
    for (const n of ['A', 'B', 'C', 'D', 'E']) {
      await createTeacher(client, school15, { full_name: `ZZZ_TENANT_TEST_RESTRICT_${n}`, branch: 'sınıf' });
    }
    const zone = await createDutyZone(client, school15, { name: 'ZZZ_TENANT_TEST_RESTRICT_ZONE', required_count: 1 });

    // 3 hafta üret: 2026-10-05 Pzt ... 2026-10-23 Cum.
    await generateBulkSchedule(client, { schoolId: school15, startDate: START, endDate: '2026-10-23' });

    const rows = await countAssignments(client, zone.id);
    const wedRows = rows.filter((r) => {
      const [y, m, d] = r.duty_date.split('-').map(Number);
      return new Date(y, m - 1, d).getDay() === 3; // Çarşamba
    });
    // Aralıktaki her Çarşamba (10-07, 10-14, 10-21) kısıtlı öğretmene ait olmalı.
    expect(wedRows.map((r) => r.duty_date).sort()).toEqual(['2026-10-07', '2026-10-14', '2026-10-21']);
    wedRows.forEach((r) => expect(r.teacher_id).toBe(wed.id));
  }, 40000);

  it('haftalık sıralı yer değişimi: aynı günün ekibi bir sonraki hafta bir sonraki bölgeye kayar', async () => {
    // Gün-öncelikli tek döngü (advanceWeekGrid), Pazartesi'nin ilk
    // bölgesini haftanın SON gününün (Cuma) son bölgesinden türetir —
    // yani düzenin haftanın HER gününde (sadece Pazartesi'de değil) bir
    // ekibi olması gerekir, yoksa boş hücreler döngüyü bozar. Haftalık
    // nöbet limiti (max_duty_per_week) her öğretmeni haftada 1 nöbetle
    // sınırladığından, 5 günün 3'er bölgesini de doldurmak için
    // 5 gün × 3 bölge = 15 öğretmen gerekiyor (gerçek okulda da haftanın
    // her günü ayrı bir ekip varsa bu kadar personel gerekir).
    const school7 = await signUpAndRegisterSchool(client, makeTestUser('bulk-shift', RUN_ID));
    for (let i = 1; i <= 15; i++) {
      await createTeacher(client, school7, { full_name: `ZZZ_TENANT_TEST_SHIFT_T${String(i).padStart(2, '0')}`, branch: 'sınıf' });
    }
    // Eklenme sırası = rotasyon sırası: A → B → C → başa dön.
    const zoneA = await createDutyZone(client, school7, { name: 'ZZZ_TENANT_TEST_SHIFT_ZONE_A', required_count: 1 });
    const zoneB = await createDutyZone(client, school7, { name: 'ZZZ_TENANT_TEST_SHIFT_ZONE_B', required_count: 1 });
    const zoneC = await createDutyZone(client, school7, { name: 'ZZZ_TENANT_TEST_SHIFT_ZONE_C', required_count: 1 });

    // 3 hafta üret: 2026-10-05 Pzt ... 2026-10-23 Cum.
    await generateBulkSchedule(client, { schoolId: school7, startDate: START, endDate: '2026-10-23' });

    const layout = await layoutByDate(client, school7);

    // 1. hafta Pazartesi düzeni ne olursa olsun, 2. ve 3. hafta
    // Pazartesileri her öğretmen bir bölge İLERİ gitmiş olmalı
    // (kullanıcının şikayeti: A Blok'taki öğretmen ertesi hafta B Blok'a
    // geçmeli, bölge atlamamalı). Döngü GÜN-ÖNCELİKLİ tek bir dizi
    // olduğundan (bkz. lib/engine/rotation.js advanceWeekGrid) bu kayma
    // sadece AYNI GÜN içindeki ardışık bölgeler arasında geçerlidir —
    // haftanın SON bölgesindeki (zoneC) ekip bir sonraki haftanın AYNI
    // günü değil, bir sonraki GÜNÜN ilk bölgesine geçer (aşağıda ayrıca
    // doğrulanıyor).
    const zoneOrder = [zoneA.id, zoneB.id];
    for (const [mon1, mon2] of [['2026-10-05', '2026-10-12'], ['2026-10-12', '2026-10-19']]) {
      for (let i = 0; i < zoneOrder.length - 1; i++) {
        const teamThisWeek = layout[mon1]?.[zoneOrder[i]] || [];
        const teamNextWeek = layout[mon2]?.[zoneOrder[i + 1]] || [];
        expect(teamNextWeek).toEqual(teamThisWeek);
      }
    }
    // Pazartesi'nin SON bölgesindeki (zoneC) ekip, bir sonraki HAFTANIN
    // Salı'sının İLK bölgesine (zoneA) geçer — gün-öncelikli döngü bölge
    // listesi bitince günü ilerletir (haftayı değil, günü).
    for (const [mon, nextWeekTue] of [['2026-10-05', '2026-10-13'], ['2026-10-12', '2026-10-20']]) {
      expect(layout[nextWeekTue]?.[zoneA.id] || []).toEqual(layout[mon]?.[zoneC.id] || []);
    }
    // Her Pazartesi üç bölge de dolu.
    expect(Object.keys(layout['2026-10-05'] || {})).toHaveLength(3);
  }, 40000);

  it('aynı aralığı tekrar üretmek ve aralığı uzatmak sırayı bozmaz (idempotent devam)', async () => {
    // Aynı sebeple (bkz. yukarıdaki test) haftanın her günü + her iki
    // bölge dolu olmalı: 5 gün × 2 bölge = 10 öğretmen.
    const school8 = await signUpAndRegisterSchool(client, makeTestUser('bulk-shift-idem', RUN_ID));
    for (let i = 1; i <= 10; i++) {
      await createTeacher(client, school8, { full_name: `ZZZ_TENANT_TEST_SHIDEM_T${String(i).padStart(2, '0')}`, branch: 'sınıf' });
    }
    const zoneA = await createDutyZone(client, school8, { name: 'ZZZ_TENANT_TEST_SHIDEM_ZONE_A', required_count: 1 });
    const zoneB = await createDutyZone(client, school8, { name: 'ZZZ_TENANT_TEST_SHIDEM_ZONE_B', required_count: 1 });

    // 1. hafta üret, düzeni kaydet.
    await generateBulkSchedule(client, { schoolId: school8, startDate: START, endDate: END });
    const week1 = await layoutByDate(client, school8);

    // Aynı haftayı ÜÇ kez daha üret ("Program Oluştur"a tekrar basmak) —
    // düzen birebir aynı kalmalı, sıra kaymamalı.
    await generateBulkSchedule(client, { schoolId: school8, startDate: START, endDate: END });
    await generateBulkSchedule(client, { schoolId: school8, startDate: START, endDate: END });
    const week1Again = await layoutByDate(client, school8);
    expect(week1Again).toEqual(week1);

    // Sadece 2. haftayı üret (aralığı uzatma senaryosu): 2. hafta
    // Pazartesi düzeni, DB'deki 1. hafta Pazartesi düzeninin bir bölge
    // kaydırılmışı olmalı. zoneA→zoneB kayması AYNI GÜN (Pazartesi)
    // içinde; zoneB'nin ekibi ise gün-öncelikli döngü gereği bir sonraki
    // GÜNE (Salı, 1. haftanın DEĞİL, çünkü zoneB zi=1 son bölge ve
    // prevDi aynı gün kalır — 2 bölgeli okulda zi=0 (zoneA) Cuma'dan,
    // zi=1 (zoneB) aynı günün zoneA'sından türer) geçer, bir sonraki
    // Pazartesi'ye değil.
    await generateBulkSchedule(client, { schoolId: school8, startDate: '2026-10-12', endDate: '2026-10-18' });
    const all = await layoutByDate(client, school8);
    expect(all['2026-10-12']?.[zoneB.id]).toEqual(week1['2026-10-05']?.[zoneA.id]);
    // zoneA'nın (zi=0) yeni ekibi, 1. haftanın CUMA (10-09) zoneB'sinden gelir.
    expect(all['2026-10-12']?.[zoneA.id]).toEqual(week1['2026-10-09']?.[zoneB.id]);
  }, 40000);

  it('bir hücre bir hafta boş kalırsa (çapa haftasında satır yoksa) sonraki AYRI üretimde ekibin sırası kaybolmaz', async () => {
    // Kullanıcı raporu: bir öğretmenin sırası bir haftaya kadar düzgün
    // dönerken bir hafta "kayboldu" (o hücre boş kaldı — is_manual bir
    // satır silinmiş/hiç oluşmamış olabilir) ve o hafta sonra bir daha
    // sıraya göre dönmedi. Kök neden: çapa SADECE bir önceki haftaya
    // bakıyordu — o hafta gap'liyse desen orada sıfırlanıyordu. Artık
    // gerçek sahibi bulunana kadar birkaç hafta geriye bakılıyor.
    const school14 = await signUpAndRegisterSchool(client, makeTestUser('bulk-gap-recover', RUN_ID));
    for (let i = 1; i <= 10; i++) {
      await createTeacher(client, school14, { full_name: `ZZZ_TENANT_TEST_GAP_T${String(i).padStart(2, '0')}`, branch: 'sınıf' });
    }
    const zoneA = await createDutyZone(client, school14, { name: 'ZZZ_TENANT_TEST_GAP_ZONE_A', required_count: 1 });
    const zoneB = await createDutyZone(client, school14, { name: 'ZZZ_TENANT_TEST_GAP_ZONE_B', required_count: 1 });

    // 1. hafta üret.
    await generateBulkSchedule(client, { schoolId: school14, startDate: START, endDate: END });
    const week1 = await layoutByDate(client, school14);
    const week1TueZoneB = week1['2026-10-06']?.[zoneB.id];
    expect(week1TueZoneB).toBeTruthy();

    // 2. hafta AYRI bir çağrıda üret. Normalde (gap yokken) 2. haftanın
    // Çarşamba-zoneA'sı 1. haftanın Salı-zoneB'sinden gelir (sağlık
    // kontrolü — bkz. yukarıdaki test'in aynı ilişkisi).
    await generateBulkSchedule(client, { schoolId: school14, startDate: '2026-10-12', endDate: '2026-10-16' });
    const week2Before = await layoutByDate(client, school14);
    expect(week2Before['2026-10-14']?.[zoneA.id]).toEqual(week1TueZoneB);

    // O hücreyi elle SİL — "o hafta hücre boş kaldı" senaryosunu simüle
    // ediyor (idareci silmiş olabilir ya da motor bir sebeple hiç
    // yazmamış olabilir).
    const { error: delError } = await client
      .from('duty_assignments')
      .delete()
      .eq('school_id', school14)
      .eq('zone_id', zoneA.id)
      .eq('duty_date', '2026-10-14');
    if (delError) throw new Error(delError.message);

    // 3. haftayı AYRI bir çağrıda üret — çapa artık silinmiş hücreli
    // 2. haftanın üzerine kurulacak.
    await generateBulkSchedule(client, { schoolId: school14, startDate: '2026-10-19', endDate: '2026-10-23' });
    const week3 = await layoutByDate(client, school14);

    // 2. haftanın (artık DB'de yok) Çarşamba-zoneA'sı bir adım ileri
    // giderek 3. haftanın Çarşamba-zoneB'sine geçmeliydi. Silinen satır
    // yüzünden ekip "hafızası" kaybolup yerine rastgele biri gelmemeli —
    // hâlâ 1. haftanın Salı-zoneB'sinden türeyen AYNI ekip olmalı.
    expect(week3['2026-10-21']?.[zoneB.id]).toEqual(week1TueZoneB);
  }, 60000);

  it('haftalik_yer: bölge döngüsü bitince nöbet GÜNÜ ilerler (tek bölgeli okul = her hafta gün +1)', async () => {
    // Tek bölgeli okulda bölge listesi her hafta sarar → kullanıcının
    // "bütün yerlerde tuttuktan sonra günü değişir" kuralı gereği her
    // öğretmenin günü her hafta +1 kaymalı (Cuma'daki Pazartesi'ye).
    const school9 = await signUpAndRegisterSchool(client, makeTestUser('bulk-dayshift', RUN_ID));
    const ts = [];
    for (const n of ['T1', 'T2', 'T3', 'T4', 'T5']) {
      ts.push(await createTeacher(client, school9, { full_name: `ZZZ_TENANT_TEST_DAY_${n}`, branch: 'sınıf' }));
    }
    const zone = await createDutyZone(client, school9, { name: 'ZZZ_TENANT_TEST_DAY_ZONE', required_count: 1 });

    // 1. hafta: adillik + isim sırası → Pzt T1, Sal T2, Çar T3, Per T4, Cum T5.
    await generateBulkSchedule(client, { schoolId: school9, startDate: START, endDate: END });
    const w1 = await layoutByDate(client, school9);
    expect(w1['2026-10-05'][zone.id]).toEqual([ts[0].id]);
    expect(w1['2026-10-09'][zone.id]).toEqual([ts[4].id]);

    // 2. hafta: herkes bir sonraki güne — Cuma'daki T5 Pazartesi'ye sarar.
    await generateBulkSchedule(client, { schoolId: school9, startDate: '2026-10-12', endDate: '2026-10-16' });
    const w2 = await layoutByDate(client, school9);
    expect(w2['2026-10-12'][zone.id]).toEqual([ts[4].id]); // Pzt ← eski Cuma (T5)
    expect(w2['2026-10-13'][zone.id]).toEqual([ts[0].id]); // Sal ← eski Pzt (T1)
    expect(w2['2026-10-16'][zone.id]).toEqual([ts[3].id]); // Cum ← eski Per (T4)
  }, 40000);

  it('tatil haftasında sıra İLERLEMEZ — kaldığı yerden devam eder', async () => {
    const school10 = await signUpAndRegisterSchool(client, makeTestUser('bulk-holiday-freeze', RUN_ID));
    const t1 = await createTeacher(client, school10, { full_name: 'ZZZ_TENANT_TEST_FRZ_T1', branch: 'sınıf' });
    await createTeacher(client, school10, { full_name: 'ZZZ_TENANT_TEST_FRZ_T2', branch: 'sınıf' });
    const zoneA = await createDutyZone(client, school10, { name: 'ZZZ_TENANT_TEST_FRZ_ZONE_A', required_count: 1 });
    const zoneB = await createDutyZone(client, school10, { name: 'ZZZ_TENANT_TEST_FRZ_ZONE_B', required_count: 1 });

    // 2. haftanın (12-16 Ekim) TAMAMI tatil.
    const holidays = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'].map((d) => ({
      school_id: school10, calendar_date: d, day_type: 'holiday', description: 'ZZZ Test Tatili',
    }));
    const { error } = await client.from('calendar_days').insert(holidays);
    if (error) throw new Error(error.message);

    // 1.–3. hafta tek seferde: tatil haftası sayılmadığı için 3. hafta,
    // 1. haftanın SADECE BİR adım ilerletilmişi olmalı (iki değil).
    await generateBulkSchedule(client, { schoolId: school10, startDate: START, endDate: '2026-10-23' });
    const all = await layoutByDate(client, school10);
    expect(all['2026-10-12']).toBeUndefined(); // tatil haftasına atama yok
    const w1MonA = all['2026-10-05'][zoneA.id];
    expect(all['2026-10-19'][zoneB.id]).toEqual(w1MonA); // tek adım: A ekibi B'de
    expect(w1MonA).toEqual([t1.id]);
  }, 40000);

  it('aylik_ayni_gun: ay içinde düzen sabit, ay değişince bölge +1 gün aynı', async () => {
    const school11 = await signUpAndRegisterSchool(client, makeTestUser('bulk-monthly-same', RUN_ID));
    await setSchoolRotationMode(client, school11, 'aylik_ayni_gun');
    const t1 = await createTeacher(client, school11, { full_name: 'ZZZ_TENANT_TEST_MON_T1', branch: 'sınıf' });
    const t2 = await createTeacher(client, school11, { full_name: 'ZZZ_TENANT_TEST_MON_T2', branch: 'sınıf' });
    const zoneA = await createDutyZone(client, school11, { name: 'ZZZ_TENANT_TEST_MON_ZONE_A', required_count: 1 });
    const zoneB = await createDutyZone(client, school11, { name: 'ZZZ_TENANT_TEST_MON_ZONE_B', required_count: 1 });

    // Eylül'de iki hafta + Ekim'de bir hafta.
    await generateBulkSchedule(client, { schoolId: school11, startDate: '2026-09-14', endDate: '2026-09-25' });
    await generateBulkSchedule(client, { schoolId: school11, startDate: '2026-10-05', endDate: '2026-10-09' });
    const all = await layoutByDate(client, school11);

    // Ay içi: 2. hafta düzeni 1. haftayla AYNI (aylık modda hafta içi kayma yok).
    expect(all['2026-09-21'][zoneA.id]).toEqual(all['2026-09-14'][zoneA.id]);
    expect(all['2026-09-21'][zoneB.id]).toEqual(all['2026-09-14'][zoneB.id]);
    // Ay değişince: bölge +1, gün aynı (Pazartesi ekibi Pazartesi'de).
    expect(all['2026-10-05'][zoneB.id]).toEqual(all['2026-09-14'][zoneA.id]);
    expect(all['2026-10-05'][zoneA.id]).toEqual(all['2026-09-14'][zoneB.id]);
    expect(all['2026-09-14'][zoneA.id]).toEqual([t1.id]);
    expect(all['2026-09-14'][zoneB.id]).toEqual([t2.id]);
  }, 40000);

  it('aylik_farkli_gun: ay değişince bölge +1 VE gün +1', async () => {
    const school12 = await signUpAndRegisterSchool(client, makeTestUser('bulk-monthly-diff', RUN_ID));
    await setSchoolRotationMode(client, school12, 'aylik_farkli_gun');
    // 4 öğretmen × 2 bölge: Pazartesi ve Salı ekipleri FARKLI olur, gün
    // kaymasının gerçekten olduğu ayırt edilebilir (2 öğretmenle her
    // günün düzeni aynı olurdu, test hiçbir şey kanıtlamazdı).
    for (const n of ['T1', 'T2', 'T3', 'T4']) {
      await createTeacher(client, school12, { full_name: `ZZZ_TENANT_TEST_MDF_${n}`, branch: 'sınıf' });
    }
    const zoneA = await createDutyZone(client, school12, { name: 'ZZZ_TENANT_TEST_MDF_ZONE_A', required_count: 1 });
    const zoneB = await createDutyZone(client, school12, { name: 'ZZZ_TENANT_TEST_MDF_ZONE_B', required_count: 1 });

    await generateBulkSchedule(client, { schoolId: school12, startDate: '2026-09-14', endDate: '2026-09-18' });
    await generateBulkSchedule(client, { schoolId: school12, startDate: '2026-10-05', endDate: '2026-10-09' });
    const all = await layoutByDate(client, school12);

    // Eylül Pazartesi ekibi Ekim'de SALI'ya geçer ve bölgesi +1 kayar;
    // Eylül Salı ekibi Ekim Çarşamba'ya... (gün VE yer birlikte döner).
    expect(all['2026-10-06'][zoneB.id]).toEqual(all['2026-09-14'][zoneA.id]);
    expect(all['2026-10-06'][zoneA.id]).toEqual(all['2026-09-14'][zoneB.id]);
    expect(all['2026-10-07'][zoneB.id]).toEqual(all['2026-09-15'][zoneA.id]);
    // Pazartesi ile Salı ekipleri gerçekten farklı (testin ayırt etme gücü).
    expect(all['2026-09-14'][zoneA.id]).not.toEqual(all['2026-09-15'][zoneA.id]);
  }, 40000);
});

// Bir okulun tüm atamalarını date → zoneId → sıralı teacherId[] olarak
// döndürür (düzen karşılaştırmaları için).
async function layoutByDate(client, schoolId) {
  const { data, error } = await client
    .from('duty_assignments')
    .select('duty_date, zone_id, teacher_id')
    .eq('school_id', schoolId)
    .order('duty_date');
  if (error) throw new Error(error.message);
  const layout = {};
  for (const row of data) {
    ((layout[row.duty_date] ??= {})[row.zone_id] ??= []).push(row.teacher_id);
  }
  for (const byZone of Object.values(layout)) {
    for (const team of Object.values(byZone)) team.sort();
  }
  return layout;
}
