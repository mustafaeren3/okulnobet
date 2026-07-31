'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformAuditLogs } from '@/lib/db/platformAdmin';

export async function fetchAuditLogs(schoolId) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const logs = await getPlatformAuditLogs(supabase, { schoolId });
    return { logs };
  } catch (e) {
    return { error: e.message };
  }
}
