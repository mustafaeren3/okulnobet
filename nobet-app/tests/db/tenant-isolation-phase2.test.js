import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';

// Faz 2'de eklenen 8 yeni tablonun (teachers, duty_zones, calendar_days,
// time_slots, teacher_unavailable_days, zone_closures, rules, rotations,
// exceptions, duty_assignments) hepsi aynı RLS deseni ile korunuyor:
// `school_id = current_school_id()`. Bu test her tablo için B okulunda bir
// satır oluşturup A'nın onu okuyamadığını doğrular — CLAUDE.md'nin "her yeni
// tabloda tenant izolasyon testi güncellenir" kuralı gereği.
//
// Bu migration'lar (0003-0009) canlı projeye UYGULANMADAN bu test
// başarısız olur ("relation does not exist" hatasıyla) — bu beklenen bir
// durumdur, migration'lar Supabase SQL Editor'den çalıştırılana kadar.

const RUN_ID = Date.now();

describe('tenant izolasyonu (RLS) — Faz 2 tabloları — gerçek Supabase projesine karşı', () => {
  let clientA, clientB, schoolIdA, schoolIdB, teacherIdB, zoneIdB;

  beforeAll(async () => {
    clientA = newClient();
    clientB = newClient();

    schoolIdA = await signUpAndRegisterSchool(clientA, makeTestUser('p2a', RUN_ID));
    schoolIdB = await signUpAndRegisterSchool(clientB, makeTestUser('p2b', RUN_ID));

    const { data: teacherB, error: teacherErr } = await clientB
      .from('teachers')
      .insert({ school_id: schoolIdB, full_name: 'ZZZ_TENANT_TEST_TEACHER_B', branch: 'sınıf' })
      .select()
      .single();
    if (teacherErr) throw new Error(`B okuluna teacher eklenemedi: ${teacherErr.message}`);
    teacherIdB = teacherB.id;

    const { data: zoneB, error: zoneErr } = await clientB
      .from('duty_zones')
      .insert({ school_id: schoolIdB, name: 'ZZZ_TENANT_TEST_ZONE_B' })
      .select()
      .single();
    if (zoneErr) throw new Error(`B okuluna duty_zone eklenemedi: ${zoneErr.message}`);
    zoneIdB = zoneB.id;

    await clientB.from('calendar_days').insert({ school_id: schoolIdB, calendar_date: '2026-10-29', day_type: 'holiday' });
    await clientB.from('time_slots').insert({ school_id: schoolIdB, name: 'Tam Gün', slot_key: 'full_day' });
    await clientB.from('teacher_unavailable_days').insert({ school_id: schoolIdB, teacher_id: teacherIdB, weekday: 2 });
    await clientB.from('zone_closures').insert({ school_id: schoolIdB, zone_id: zoneIdB, start_date: '2026-10-01', end_date: '2026-10-05' });
    await clientB.from('rules').insert({ school_id: schoolIdB, rule_key: 'max_weekly_duty', rule_type: 'hard', params: { max: 1 } });
    await clientB.from('rotations').insert({ school_id: schoolIdB, teacher_id: teacherIdB });
    await clientB.from('exceptions').insert({ school_id: schoolIdB, teacher_id: teacherIdB, exception_type: 'rapor', start_date: '2026-10-01', end_date: '2026-10-02' });
    await clientB.from('duty_assignments').insert({ school_id: schoolIdB, teacher_id: teacherIdB, zone_id: zoneIdB, duty_date: '2026-10-06' });
  }, 30000);

  it.each([
    'teachers',
    'duty_zones',
    'calendar_days',
    'time_slots',
    'teacher_unavailable_days',
    'zone_closures',
    'rules',
    'rotations',
    'exceptions',
    'duty_assignments',
  ])('A, B okulunun %s verisini okuyamaz', async (table) => {
    const { data, error } = await clientA.from(table).select('*').eq('school_id', schoolIdB);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('sağlık kontrolü: A kendi okulunda teacher oluşturup okuyabiliyor', async () => {
    const { data: inserted, error: insertErr } = await clientA
      .from('teachers')
      .insert({ school_id: schoolIdA, full_name: 'ZZZ_TENANT_TEST_TEACHER_A', branch: 'sınıf' })
      .select()
      .single();
    expect(insertErr).toBeNull();

    const { data, error } = await clientA.from('teachers').select('*').eq('id', inserted.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});
