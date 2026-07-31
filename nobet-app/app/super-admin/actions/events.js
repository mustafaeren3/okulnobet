'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { getPlatformSystemEvents } from '@/lib/db/systemEvents';

export async function fetchSystemEvents(limit) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const events = await getPlatformSystemEvents(supabase, limit);
    return { events };
  } catch (e) {
    return { error: e.message };
  }
}
