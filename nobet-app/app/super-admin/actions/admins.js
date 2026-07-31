'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, grantPlatformAdmin, revokePlatformAdmin, getPlatformAdmins } from '@/lib/db/platformAdmin';

export async function fetchAdmins() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const admins = await getPlatformAdmins(supabase);
    return { admins };
  } catch (e) {
    return { error: e.message };
  }
}

// Owner-only (RPC seviyesinde platform_require_owner ile zorunlu) — admin
// olmayan/owner olmayan bir çağrı burada değil, RPC'de reddedilir; DAL
// katmanı sadece temel "admin + aal2" ön kontrolünü yapar.
export async function grantAdmin(email, role) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await grantPlatformAdmin(supabase, email, role);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function revokeAdmin(userId) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await revokePlatformAdmin(supabase, userId);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
