'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { listMedia, uploadMedia, deleteMedia, updateMediaMeta } from '@/lib/db/media';

export async function fetchMedia() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    return { items: await listMedia(supabase) };
  } catch (e) {
    return { error: e.message };
  }
}

export async function uploadMediaFile(formData) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const file = formData.get('file');
    if (!file || !file.size) return { error: 'Dosya seçilmedi.' };
    if (file.size > 5 * 1024 * 1024) return { error: 'Dosya 5MB\'dan büyük olamaz.' };
    const { data: { user } } = await supabase.auth.getUser();
    const item = await uploadMedia(supabase, file, user.id);
    revalidatePath('/super-admin/media');
    return { item };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeMediaFile(id, storagePath) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await deleteMedia(supabase, id, storagePath);
    revalidatePath('/super-admin/media');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function updateMediaFile(id, patch) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await updateMediaMeta(supabase, id, patch);
    revalidatePath('/super-admin/media');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
