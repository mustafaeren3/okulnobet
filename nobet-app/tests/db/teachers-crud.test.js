import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '@/lib/db/teachers';
import { getUnavailableWeekdays, setUnavailableWeekdays } from '@/lib/db/teacherAvailability';

// lib/db katmanının gerçek Supabase'e karşı doğru çalıştığını doğrular
// (RLS izolasyonu tenant-isolation-phase2.test.js'te zaten kanıtlandı,
// burada fonksiyonel doğruluk test ediliyor: CRUD + weekday round-trip).

const RUN_ID = Date.now();

describe('lib/db/teachers + teacherAvailability', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('crud', RUN_ID));
  }, 30000);

  it('createTeacher + getTeachers', async () => {
    const teacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_TEACHER_CRUD',
      branch: 'sınıf',
    });
    expect(teacher.full_name).toBe('ZZZ_TENANT_TEST_TEACHER_CRUD');
    expect(teacher.weekly_capacity).toBe(1);
    expect(teacher.allow_double_duty).toBe(false);
    expect(teacher.restriction_mode).toBe('ALL');
    expect(teacher.is_active).toBe(true);

    const list = await getTeachers(client, schoolId);
    expect(list.find((t) => t.id === teacher.id)).toBeTruthy();
  });

  it('updateTeacher değişiklikleri kalıcı olarak uygular', async () => {
    const teacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_TEACHER_CRUD_2',
      branch: 'müzik',
    });

    const updated = await updateTeacher(client, teacher.id, {
      weekly_capacity: 3,
      allow_double_duty: true,
      restriction_mode: 'EXCEPT',
      is_active: false,
    });

    expect(updated.weekly_capacity).toBe(3);
    expect(updated.allow_double_duty).toBe(true);
    expect(updated.restriction_mode).toBe('EXCEPT');
    expect(updated.is_active).toBe(false);
  });

  it('setUnavailableWeekdays + getUnavailableWeekdays round-trip yapar', async () => {
    const teacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_TEACHER_CRUD_3',
      branch: 'beden eğitimi',
      restriction_mode: 'ONLY',
    });

    await setUnavailableWeekdays(client, schoolId, teacher.id, [1, 3, 5]);
    let days = await getUnavailableWeekdays(client, teacher.id);
    expect(days.sort()).toEqual([1, 3, 5]);

    // İkinci çağrı öncekini tamamen değiştirmeli, biriktirmemeli
    await setUnavailableWeekdays(client, schoolId, teacher.id, [2]);
    days = await getUnavailableWeekdays(client, teacher.id);
    expect(days).toEqual([2]);

    // Boş dizi → tüm günleri temizler
    await setUnavailableWeekdays(client, schoolId, teacher.id, []);
    days = await getUnavailableWeekdays(client, teacher.id);
    expect(days).toEqual([]);
  });

  it('deleteTeacher kaydı kaldırır', async () => {
    const teacher = await createTeacher(client, schoolId, {
      full_name: 'ZZZ_TENANT_TEST_TEACHER_CRUD_4',
      branch: 'sınıf',
    });

    await deleteTeacher(client, teacher.id);
    const list = await getTeachers(client, schoolId);
    expect(list.find((t) => t.id === teacher.id)).toBeUndefined();
  });
});
