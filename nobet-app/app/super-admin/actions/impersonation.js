'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { startImpersonation, endImpersonation } from '@/lib/db/impersonation';

// Yetki: platform_start_impersonation/platform_end_impersonation RPC'leri
// zaten platform_require_admin() (üyelik + aal2) çağırıyor (bkz. migration
// 0035) — requirePlatformAdmin() burada erken/anlaşılır hata için ikinci
// katman, RLS zaten reddeder.
export async function startImpersonationAction(schoolId, reason) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await startImpersonation(supabase, schoolId, reason);
  } catch (e) {
    return { error: e.message };
  }
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function endImpersonationAction() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await endImpersonation(supabase);
  } catch (e) {
    return { error: e.message };
  }
  revalidatePath('/dashboard');
  redirect('/super-admin');
}
