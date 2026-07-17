'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createTeacher, updateTeacher, deleteTeacher } from '@/lib/db/teachers';
import { getUnavailableWeekdays, setUnavailableWeekdays } from '@/lib/db/teacherAvailability';

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

export async function addTeacher(payload) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const teacher = await createTeacher(supabase, schoolId, payload);
    revalidatePath('/teachers');
    return { teacher };
  } catch (e) {
    return { error: e.message };
  }
}

export async function editTeacher(teacherId, patch) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    const teacher = await updateTeacher(supabase, teacherId, patch);
    revalidatePath('/teachers');
    return { teacher };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeTeacher(teacherId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    await deleteTeacher(supabase, teacherId);
    revalidatePath('/teachers');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchTeacherAvailability(teacherId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    const weekdays = await getUnavailableWeekdays(supabase, teacherId);
    return { weekdays };
  } catch (e) {
    return { error: e.message };
  }
}

export async function saveTeacherAvailability(teacherId, weekdays) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const rows = await setUnavailableWeekdays(supabase, schoolId, teacherId, weekdays);
    revalidatePath('/teachers');
    return { rows };
  } catch (e) {
    return { error: e.message };
  }
}
