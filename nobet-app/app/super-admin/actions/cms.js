'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { getAllSiteContent, setSiteContent, listSeoMeta, setSeoMeta } from '@/lib/db/cms';

// Yazma zaten RLS ile korunuyor (migration 0034, platform_is_admin_aal2) —
// requirePlatformAdmin() burada erken/anlaşılır hata için ikinci katman.

export async function fetchAllSiteContent() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    return { content: await getAllSiteContent(supabase) };
  } catch (e) {
    return { error: e.message };
  }
}

export async function saveSiteContent(key, value) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const { data: { user } } = await supabase.auth.getUser();
    await setSiteContent(supabase, key, value, user.id);
    revalidatePath('/');
    revalidatePath('/gizlilik');
    revalidatePath('/kullanim-sartlari');
    revalidatePath('/cerez-politikasi');
    revalidatePath('/super-admin/content');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchAllSeoMeta() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    return { rows: await listSeoMeta(supabase) };
  } catch (e) {
    return { error: e.message };
  }
}

export async function saveSeoMeta(path, fields) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const { data: { user } } = await supabase.auth.getUser();
    await setSeoMeta(supabase, path, fields, user.id);
    revalidatePath(path);
    revalidatePath('/super-admin/seo');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
