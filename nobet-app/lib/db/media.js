// Medya kütüphanesi — Supabase Storage ('media' bucket, public) + bunun
// üzerine WordPress benzeri metadata (alt text, orijinal ad) tutan
// media_library tablosu (storage'ın kendisi bunu tutmuyor). Yazma RLS
// ile korunuyor (bkz. migration 0034).

const BUCKET = 'media';

export async function listMedia(supabase) {
  const { data, error } = await supabase.from('media_library').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function uploadMedia(supabase, file, userId) {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { data, error } = await supabase
    .from('media_library')
    .insert({
      storage_path: path,
      public_url: urlData.publicUrl,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: userId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMedia(supabase, id, storagePath) {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (storageError) throw new Error(storageError.message);
  const { error } = await supabase.from('media_library').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateMediaMeta(supabase, id, { originalName, altText }) {
  const patch = {};
  if (originalName !== undefined) patch.original_name = originalName;
  if (altText !== undefined) patch.alt_text = altText;
  const { error } = await supabase.from('media_library').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}
