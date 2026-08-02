import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { getYearlyDistribution } from '@/lib/db/dutyAssignments';
import { buildYearlyDistribution } from '@/lib/engine/distribution';

// Kalite denetimi bulgusu: eski getAllAssignmentsForSchool() PostgREST'in
// varsayılan 1000 satır sayfalama limitine sessizce takılabiliyordu. Bu
// testler get_yearly_distribution RPC'sinin (supabase/migrations/0040)
// 1000, 2500 ve 10.000+ ham duty_assignments satırında bile EKSİKSİZ
// sonuç verdiğini — ve NAIF bir "tüm satırları çek" sorgusunun (eski
// yaklaşım) AYNI hacimde GERÇEKTEN kesildiğini — kanıtlar.

const RUN_ID = Date.now();

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// zoneCount × dateCount adet duty_assignments satırı üretir (1 öğretmen,
// N bölge, M farklı tarih — unique(teacher_id, duty_date, slot_key, zone_id)
// kısıtı zone_id farklılığıyla sağlanır, gerçekçi bir takvim üretmeye
// gerek yok, sadece HAM SATIR HACMİ önemli).
async function seedAssignments(client, schoolId, teacherId, zoneCount, dateCount) {
  const { data: zones, error: zoneErr } = await client
    .from('duty_zones')
    .insert(Array.from({ length: zoneCount }, (_, i) => ({ school_id: schoolId, name: `ZZZ_TENANT_TEST_VOL_ZONE_${i}` })))
    .select('id');
  if (zoneErr) throw new Error(`bölge toplu eklenemedi: ${zoneErr.message}`);

  const dates = Array.from({ length: dateCount }, (_, i) => {
    const d = new Date(2020, 0, 1 + i); // yerel tarih, yeterince geniş aralık
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const rows = [];
  for (const zone of zones) {
    for (const date of dates) {
      rows.push({ school_id: schoolId, teacher_id: teacherId, zone_id: zone.id, duty_date: date });
    }
  }

  for (const batch of chunk(rows, 1000)) {
    const { error } = await client.from('duty_assignments').insert(batch);
    if (error) throw new Error(`toplu atama eklenemedi: ${error.message}`);
  }

  return rows.length;
}

describe('Yıllık Dağılım — büyük hacimde eksiksizlik (1000 satır limiti aşımı)', () => {
  let client;

  beforeAll(() => {
    client = newClient();
  });

  it.each([
    ['1000-rows', 50, 20], // 1000
    ['2500-rows', 50, 50], // 2500
    ['12000-rows', 100, 120], // 12000 — 10.000+ hedefi
  ])('%s: get_yearly_distribution TÜM kayıtları eksiksiz aggregate eder', async (label, zoneCount, dateCount) => {
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser(`vol-${label}`, RUN_ID));
    const teacher = await createTeacher(client, schoolId, { full_name: `ZZZ_TENANT_TEST_VOL_TEACHER_${label}`, branch: 'sınıf' });

    const expectedTotal = await seedAssignments(client, schoolId, teacher.id, zoneCount, dateCount);
    expect(expectedTotal).toBe(zoneCount * dateCount);

    // Ground truth: PostgREST'in count:'exact' modu Content-Range
    // üzerinden GERÇEK toplam satır sayısını döner — sayfa boyutundan
    // (default 1000) BAĞIMSIZ. Seed'in gerçekten hedeflenen hacimde
    // olduğunu bağımsız bir yoldan doğrular.
    const { count: trueCount, error: countErr } = await client
      .from('duty_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId);
    if (countErr) throw new Error(countErr.message);
    expect(trueCount).toBe(expectedTotal);

    // Asıl doğrulama: RPC ile aggregate edilen toplam, ham satır sayısıyla
    // BİREBİR eşleşmeli — tek bir kayıt bile eksik/fazla sayılmamalı.
    const monthlyCountRows = await getYearlyDistribution(client);
    const rpcTotal = monthlyCountRows.reduce((sum, r) => sum + r.duty_count, 0);
    expect(rpcTotal).toBe(expectedTotal);

    // Uçtan uca: buildYearlyDistribution (saf motor) de aynı toplamı
    // üretmeli — RPC → JS aggregasyon hattının tamamı doğru.
    const monthlyCounts = monthlyCountRows.map((r) => ({
      teacherId: r.teacher_id,
      fullName: r.full_name,
      monthKey: r.month_key,
      count: r.duty_count,
    }));
    const distribution = buildYearlyDistribution(monthlyCounts, [teacher]);
    expect(distribution.totalDuties).toBe(expectedTotal);
    expect(distribution.perTeacher[0].totalCount).toBe(expectedTotal);
  }, 120000);

  it('KARŞILAŞTIRMA — naif "tüm satırları tarih filtresiz çek" sorgusu bu hacimde GERÇEKTEN kesilir (eski yaklaşımın kanıtlanmış hatası)', async () => {
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('vol-naive-proof', RUN_ID));
    const teacher = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_VOL_NAIVE_TEACHER', branch: 'sınıf' });
    const expectedTotal = await seedAssignments(client, schoolId, teacher.id, 60, 20); // 1200 satır

    // Eski getAllAssignmentsForSchool()'ın yaptığı TAM olarak buydu:
    // tarih filtresiz, .range()/limit yok, tek select.
    const { data: naiveRows, error } = await client
      .from('duty_assignments')
      .select('teacher_id, duty_date')
      .eq('school_id', schoolId)
      .order('duty_date');
    if (error) throw new Error(error.message);

    expect(expectedTotal).toBeGreaterThan(1000);
    // Bu, düzeltmeden ÖNCEKİ kodun neden yanlış olduğunun kanıtı: naif
    // sorgu PostgREST'in varsayılan sayfa boyutunda (genelde 1000) kesilir,
    // seed edilen gerçek satır sayısına ULAŞAMAZ.
    expect(naiveRows.length).toBeLessThan(expectedTotal);

    // Buna karşılık RPC tam sayıyı verir — düzeltmenin kanıtı.
    const monthlyCountRows = await getYearlyDistribution(client);
    const rpcTotal = monthlyCountRows.reduce((sum, r) => sum + r.duty_count, 0);
    expect(rpcTotal).toBe(expectedTotal);
  }, 60000);
});
