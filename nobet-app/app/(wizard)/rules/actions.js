'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSchoolId } from '@/lib/db/schoolContext';
import { getActiveHardRuleKeys, setHardRuleActive } from '@/lib/db/rules';

export async function fetchActiveRuleKeys() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const activeKeys = await getActiveHardRuleKeys(supabase, schoolId);
    return { activeKeys: [...activeKeys] };
  } catch (e) {
    return { error: e.message };
  }
}

export async function toggleRule(ruleKey, isActive) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    await setHardRuleActive(supabase, schoolId, ruleKey, isActive);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
