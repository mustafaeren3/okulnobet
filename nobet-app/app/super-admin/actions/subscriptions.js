'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  requirePlatformAdmin,
  extendSchoolTrial,
  setSchoolSubscription,
  freezeSchool,
  reopenSchool,
  cancelSubscription,
  adjustFreeQuota,
} from '@/lib/db/platformAdmin';

export async function extendTrial(schoolId, days, reason) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await extendSchoolTrial(supabase, schoolId, days, reason);
    revalidatePath('/super-admin');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    revalidatePath('/super-admin/users');
    revalidatePath(`/super-admin/users/${schoolId}`);
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
    revalidatePath(`/super-admin/schools/${schoolId}`);
    revalidatePath('/super-admin/users');
    revalidatePath(`/super-admin/users/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function freeze(schoolId, reason) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await freezeSchool(supabase, schoolId, reason);
    revalidatePath('/super-admin');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    revalidatePath('/super-admin/users');
    revalidatePath(`/super-admin/users/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function reopen(schoolId, reason) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await reopenSchool(supabase, schoolId, reason);
    revalidatePath('/super-admin');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    revalidatePath('/super-admin/users');
    revalidatePath(`/super-admin/users/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function cancel(schoolId, reason) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await cancelSubscription(supabase, schoolId, reason);
    revalidatePath('/super-admin');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    revalidatePath('/super-admin/users');
    revalidatePath(`/super-admin/users/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function adjustQuota(schoolId, newQuota, reason) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await adjustFreeQuota(supabase, schoolId, newQuota, reason);
    revalidatePath('/super-admin');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    revalidatePath('/super-admin/users');
    revalidatePath(`/super-admin/users/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
