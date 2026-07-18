import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { createDutyZone } from '@/lib/db/dutyZones';
import { assignTeachersToZone } from '@/lib/db/scheduling';

// assignTeachersToZone'un gerçek Supabase verisiyle uçtan uca
// (seçim → duty_assignments'a yazma) doğru çalıştığını kanıtlar.

const RUN_ID = Date.now();

describe('lib/db/scheduling — assignTeachersToZone', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('scheduling', RUN_ID));
  }, 30000);

  it('required_count kadar uygun öğretmeni seçip duty_assignments satırı olarak kaydeder', async () => {
    const teacherA = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SCHED_A', branch: 'sınıf' });
    const teacherB = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SCHED_B', branch: 'sınıf' });
    const teacherC = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_SCHED_C', branch: 'sınıf' });
    const zone = await createDutyZone(client, schoolId, { name: 'ZZZ_TENANT_TEST_SCHED_ZONE', required_count: 2 });

    const created = await assignTeachersToZone(client, {
      schoolId,
      zoneId: zone.id,
      date: '2026-10-06', // Salı
    });

    expect(created).toHaveLength(2);
    created.forEach((row) => {
      expect(row.school_id).toBe(schoolId);
      expect(row.zone_id).toBe(zone.id);
      expect(row.duty_date).toBe('2026-10-06');
      expect(row.slot_key).toBe('full_day');
    });

    // Gerçekten DB'ye yazıldığını doğrula (in-memory dönüş değeri değil).
    const { data: rows, error } = await client
      .from('duty_assignments')
      .select('teacher_id')
      .eq('zone_id', zone.id)
      .eq('duty_date', '2026-10-06');
    expect(error).toBeNull();
    expect(rows).toHaveLength(2);

    const assignedIds = rows.map((r) => r.teacher_id).sort();
    const candidateIds = [teacherA.id, teacherB.id, teacherC.id].sort();
    assignedIds.forEach((id) => expect(candidateIds).toContain(id));
  }, 15000);

  it('uygun aday yoksa boş dizi döndürür, hata fırlatmaz', async () => {
    const zone = await createDutyZone(client, schoolId, {
      name: 'ZZZ_TENANT_TEST_SCHED_ZONE_EMPTY',
      required_count: 1,
      allowed_branches: ['bu-branş-hiçbir-öğretmende-yok'],
    });

    const created = await assignTeachersToZone(client, {
      schoolId,
      zoneId: zone.id,
      date: '2026-10-06',
    });

    expect(created).toEqual([]);
  });
});
