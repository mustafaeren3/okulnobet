'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, recordPayment, getPlatformPayments } from '@/lib/db/platformAdmin';

export async function submitPayment({ schoolId, amount, method, note, reason }) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await recordPayment(supabase, { schoolId, amount, method, note, reason });
    revalidatePath('/super-admin/payments');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchPayments(schoolId) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const payments = await getPlatformPayments(supabase, { schoolId });
    return { payments };
  } catch (e) {
    return { error: e.message };
  }
}
