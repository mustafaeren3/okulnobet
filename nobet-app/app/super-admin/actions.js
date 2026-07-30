'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  requirePlatformAdmin,
  getPlatformSchools,
  extendSchoolTrial,
  setSchoolSubscription,
  freezeSchool,
} from '@/lib/db/platformAdmin';

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

export async function extendTrial(schoolId, days) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await extendSchoolTrial(supabase, schoolId, days);
    revalidatePath('/super-admin');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function updateSubscription(schoolId, patch) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await setSchoolSubscription(supabase, schoolId, patch);
    revalidatePath('/super-admin');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function freeze(schoolId) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await freezeSchool(supabase, schoolId);
    revalidatePath('/super-admin');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
