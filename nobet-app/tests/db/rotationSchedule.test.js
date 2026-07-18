import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';

// generateBulkSchedule'ın Faz A'sının (haftalık yer rotasyonu) gerçek
// Supabase verisiyle uçtan uca doğru çalıştığını kanıtlar: öğretmen bir
// hafta boyunca aynı bölgede kalıyor, hafta değişince cursor ilerliyor
// ve kalıcı olarak kaydediliyor.

const RUN_ID = Date.now();
// 2026-10-05 (Pzt, 1. hafta) ... 2026-10-16 (Cuma, 2. hafta).
const START = '2026-10-05';
const END = '2026-10-16';

async function rowsForTeacher(client, teacherId) {
  const { data, error } = await client
    .from('duty_assignments')
    .select('duty_date, zone_id')
    .eq('teacher_id', teacherId)
    .order('duty_date');
  if (error) throw new Error(error.message);
  return data;
}

describe('lib/db/bulkSchedule — Faz A: haftalık yer rotasyonu', () => {
  let client, schoolId, rotatingTeacher, zoneA, zoneB;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('rotation', RUN_ID));

    rotatingTeacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_ROT_TEACHER',
      branch: 'sınıf',
    });
    // İkinci bir öğretmen: rotasyona dahil değil, sadece Faz B'nin
    // (basit adillik) rotasyon dışı kalan slotları doğru doldurduğunu
    // görmek için var.
    await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_ROT_OTHER', branch: 'sınıf' });

    // Aynı priority (varsayılan 0) → isim sırasına göre A önce gelir.
    zoneA = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_ROT_ZONE_A', required_count: 1 });
    zoneB = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_ROT_ZONE_B', required_count: 1 });

    const { error } = await client.from('rotations').insert({
      school_id: schoolId,
      teacher_id: rotatingTeacher.id,
      rotation_mode: 'haftalik_yer',
      zone_cursor: 0,
      day_cursor: 0,
      cycle_count: 0,
    });
    if (error) throw new Error(`rotation eklenemedi: ${error.message}`);
  }, 30000);

  it('rotasyondaki öğretmen 1. hafta A, 2. hafta B bölgesine atanır', async () => {
    await generateBulkSchedule(client, { schoolId, startDate: START, endDate: END });

    const rows = await rowsForTeacher(client, rotatingTeacher.id);
    const week1 = rows.filter((r) => r.duty_date < '2026-10-12');
    const week2 = rows.filter((r) => r.duty_date >= '2026-10-12');

    expect(week1.length).toBeGreaterThan(0);
    expect(week2.length).toBeGreaterThan(0);
    week1.forEach((r) => expect(r.zone_id).toBe(zoneA.id));
    week2.forEach((r) => expect(r.zone_id).toBe(zoneB.id));
  }, 30000);

  it('cursor 2 hafta sonunda kalıcı olarak doğru ilerletilir (0 → 1 → 0, cycle_count 1)', async () => {
    const { data, error } = await client
      .from('rotations')
      .select('zone_cursor, cycle_count, last_advanced')
      .eq('teacher_id', rotatingTeacher.id)
      .single();
    expect(error).toBeNull();
    expect(data.zone_cursor).toBe(0); // (0+1)%2=1, (1+1)%2=0 — 2 tam tur sonrası başa döndü
    expect(data.cycle_count).toBe(1);
    expect(data.last_advanced).toBe('2026-10-12'); // son işlenen haftanın Pazartesi'si
  }, 30000);

  it('rotasyon dışı slotlar hâlâ basit adillikle doluyor', async () => {
    const otherRows = await client
      .from('duty_assignments')
      .select('duty_date')
      .eq('school_id', schoolId)
      .neq('teacher_id', rotatingTeacher.id);
    expect(otherRows.error).toBeNull();
    // İki bölge de required_count=1, rotasyondaki öğretmen her gün
    // bölgelerden birini dolduruyor; diğer bölge diğer öğretmenle dolmalı.
    expect(otherRows.data.length).toBeGreaterThan(0);
  }, 30000);
});
