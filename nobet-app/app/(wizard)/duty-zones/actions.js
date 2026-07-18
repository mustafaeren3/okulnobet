'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createDutyZone, updateDutyZone, deleteDutyZone } from '@/lib/db/dutyZones';

async function requireSchoolId(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapılmamış.');
  const { data: schoolUser } = await supabase
    .from('school_users')
    .select('school_id')
    .eq('user_id', user.id)
    .single();
  if (!schoolUser) throw new Error('Kullanıcı bir okula bağlı değil.');
  return schoolUser.school_id;
}

export async function addDutyZone(payload) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const zone = await createDutyZone(supabase, schoolId, payload);
    revalidatePath('/duty-zones');
    return { zone };
  } catch (e) {
    return { error: e.message };
  }
}

export async function editDutyZone(zoneId, patch) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    const zone = await updateDutyZone(supabase, zoneId, patch);
    revalidatePath('/duty-zones');
    return { zone };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeDutyZone(zoneId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    await deleteDutyZone(supabase, zoneId);
    revalidatePath('/duty-zones');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
