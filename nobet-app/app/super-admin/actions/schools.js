'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformSchools, getPlatformSchoolsPage, getSchoolDetail, addSchoolNote } from '@/lib/db/platformAdmin';

// Genel Bakış'ın tüm-okul agregasyonu için (bkz. computePlatformMetrics) —
// Okullar sayfası bunu DEĞİL, fetchSchoolsPage'i kullanır.
export async function fetchPlatformSchools() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const schools = await getPlatformSchools(supabase);
    return { schools };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchSchoolsPage(filters) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const rows = await getPlatformSchoolsPage(supabase, filters);
    const totalCount = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
    return { rows, totalCount };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchSchoolDetail(schoolId) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const detail = await getSchoolDetail(supabase, schoolId);
    if (!detail) return { error: 'Okul bulunamadı.' };
    return { detail };
  } catch (e) {
    return { error: e.message };
  }
}

export async function submitSchoolNote(schoolId, note) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await addSchoolNote(supabase, schoolId, note);
    revalidatePath(`/super-admin/schools/${schoolId}`);
    revalidatePath(`/super-admin/users/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
