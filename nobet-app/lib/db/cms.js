// site_content + seo_meta — canlı sitenin (marketing sayfaları + admin
// panel) OKUDUĞU tek kaynak. Yazma RLS ile korunuyor (bkz. migration
// 0034 — platform_is_admin_aal2()), bu yüzden burada requirePlatformAdmin()
// çağrısı SAVUNMA amaçlı ikinci katman (RLS zaten reddeder, ama hata
// mesajı burada daha erken ve daha anlaşılır kesiliyor).
import { cache } from 'react';

export async function getSiteContent(supabase, key) {
  const { data, error } = await supabase.from('site_content').select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

// RootLayout HEM generateMetadata'da HEM component gövdesinde
// 'global_settings'i okuyor (analytics script'leri + site adı/GSC kodu
// için) — cache() olmadan bu tek sayfa yüklemesinde 2 gereksiz sorgu
// demekti. createClient() de cache()'li olduğu için (bkz.
// lib/supabase/server.js) burada anahtar tutarlı kalıyor, aynı istekte
// ikinci çağrı DB'ye hiç gitmiyor.
export const getSiteContentCached = cache(getSiteContent);

export async function getAllSiteContent(supabase) {
  const { data, error } = await supabase.from('site_content').select('key, value, updated_at');
  if (error) throw new Error(error.message);
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]));
}

export async function setSiteContent(supabase, key, value, userId) {
  const { error } = await supabase.from('site_content').upsert({ key, value, updated_at: new Date().toISOString(), updated_by: userId });
  if (error) throw new Error(error.message);
}

export async function getSeoMeta(supabase, path) {
  const { data, error } = await supabase.from('seo_meta').select('*').eq('path', path).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listSeoMeta(supabase) {
  const { data, error } = await supabase.from('seo_meta').select('*').order('path');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function setSeoMeta(supabase, path, fields, userId) {
  const { error } = await supabase.from('seo_meta').upsert({ path, ...fields, updated_at: new Date().toISOString(), updated_by: userId });
  if (error) throw new Error(error.message);
}
