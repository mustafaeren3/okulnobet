import { describe, it, expect, beforeAll } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { createTeacher } from '@/lib/db/teachers';
import { getRotationForTeacher, createRotation, deleteRotation } from '@/lib/db/rotations';

const RUN_ID = Date.now();

describe('lib/db/rotations — getRotationForTeacher + createRotation + deleteRotation', () => {
  let client, schoolId;

  beforeAll(async () => {
    client = newClient();
    schoolId = await signUpAndRegisterSchool(client, makeTestUser('rot-toggle', RUN_ID));
  }, 30000);

  it('rotasyonu olmayan öğretmen için null döner', async () => {
    const teacher = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_ROTTOGGLE_1', branch: 'sınıf' });
    const rotation = await getRotationForTeacher(client, teacher.id);
    expect(rotation).toBeNull();
  });

  it('createRotation cursor\'ları 0\'dan başlatır, getRotationForTeacher onu bulur', async () => {
    const teacher = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_ROTTOGGLE_2', branch: 'sınıf' });
    const created = await createRotation(client, schoolId, teacher.id, 'haftalik_yer');
    expect(created.zone_cursor).toBe(0);
    expect(created.cycle_count).toBe(0);
    expect(created.rotation_mode).toBe('haftalik_yer');

    const fetched = await getRotationForTeacher(client, teacher.id);
    expect(fetched.id).toBe(created.id);
  });

  it('deleteRotation kaydı kaldırır', async () => {
    const teacher = await createTeacher(client, schoolId, { full_name: 'ZZZ_TENANT_TEST_ROTTOGGLE_3', branch: 'sınıf' });
    const created = await createRotation(client, schoolId, teacher.id, 'haftalik_yer');

    await deleteRotation(client, created.id);

    const fetched = await getRotationForTeacher(client, teacher.id);
    expect(fetched).toBeNull();
  });
});
