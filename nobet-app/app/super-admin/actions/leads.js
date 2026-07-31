'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformEnterpriseLeads, getPlatformPurchaseIntents } from '@/lib/db/platformAdmin';

export async function fetchEnterpriseLeads() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const leads = await getPlatformEnterpriseLeads(supabase);
    return { leads };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchPurchaseIntents() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const intents = await getPlatformPurchaseIntents(supabase);
    return { intents };
  } catch (e) {
    return { error: e.message };
  }
}
