'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSchoolId } from '@/lib/db/schoolContext';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';
import { getAssignmentsForRange, createManualAssignment, deleteAssignment } from '@/lib/db/dutyAssignments';
import { getTeachers } from '@/lib/db/teachers';

export async function runBulkSchedule(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    const result = await generateBulkSchedule(supabase, { schoolId, startDate, endDate });
    const rows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
    revalidatePath('/schedule');
    return { ...result, rows };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchScheduleView(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    const rows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
    return { rows };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchTeacherOptions() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const teachers = await getTeachers(supabase, schoolId);
    return { teachers: teachers.filter((t) => t.is_active) };
  } catch (e) {
    return { error: e.message };
  }
}

export async function addManualAssignment({ teacherId, zoneId, date }) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const row = await createManualAssignment(supabase, schoolId, { teacherId, zoneId, date });
    revalidatePath('/schedule');
    return { row };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeAssignment(assignmentId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    await deleteAssignment(supabase, assignmentId);
    revalidatePath('/schedule');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
