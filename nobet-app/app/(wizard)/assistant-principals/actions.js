'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSchoolId } from '@/lib/db/schoolContext';
import {
  getAssistantPrincipals,
  createAssistantPrincipal,
  updateAssistantPrincipal,
  deleteAssistantPrincipal,
} from '@/lib/db/assistantPrincipals';
import { getRotationSettings, setRotationSettings } from '@/lib/db/assistantPrincipalRotationSettings';
import { ASSISTANT_PRINCIPAL_ROTATION_MODES, AP_MAX_BLOCK_SIZE_DAYS } from '@/lib/engine/assistantPrincipalRotation';

export async function fetchAssistantPrincipals() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const [people, settings] = await Promise.all([
      getAssistantPrincipals(supabase, schoolId),
      getRotationSettings(supabase, schoolId),
    ]);
    return { people, settings };
  } catch (e) {
    return { error: e.message };
  }
}

export async function addAssistantPrincipal(fullName) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!fullName?.trim()) throw new Error('Ad soyad giriniz.');
    const person = await createAssistantPrincipal(supabase, schoolId, { fullName: fullName.trim() });
    revalidatePath('/dashboard');
    return { person };
  } catch (e) {
    return { error: e.message };
  }
}

export async function editAssistantPrincipal(id, patch) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    const person = await updateAssistantPrincipal(supabase, id, patch);
    revalidatePath('/dashboard');
    return { person };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeAssistantPrincipal(id) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    await deleteAssistantPrincipal(supabase, id);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function updateAssistantPrincipalRotationSettings({ mode, blockSizeDays }) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!ASSISTANT_PRINCIPAL_ROTATION_MODES.includes(mode)) throw new Error('Geçersiz dönüşüm tipi.');
    if (mode === 'n_day_block') {
      const n = Number(blockSizeDays);
      if (!Number.isInteger(n) || n < 1 || n > AP_MAX_BLOCK_SIZE_DAYS) {
        throw new Error(`Gün sayısı 1 ile ${AP_MAX_BLOCK_SIZE_DAYS} arasında bir tam sayı olmalı.`);
      }
    }
    await setRotationSettings(supabase, schoolId, { mode, blockSizeDays: mode === 'n_day_block' ? Number(blockSizeDays) : null });
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
