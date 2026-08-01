// Impersonation ("Kullanıcı olarak giriş yap") — gerçek bir oturum/kimlik
// değişimi DEĞİL, current_school_id()'nin (bkz. migration 0035) admin'in
// KENDİ oturumu için hangi okulu hedeflediğini döndürmesi. Tüm yetki
// kontrolü DB tarafında (platform_require_admin, aal2 dahil).

export async function startImpersonation(supabase, schoolId, reason) {
  const { error } = await supabase.rpc('platform_start_impersonation', { p_school_id: schoolId, p_reason: reason || null });
  if (error) throw new Error(error.message);
}

export async function endImpersonation(supabase) {
  const { error } = await supabase.rpc('platform_end_impersonation');
  if (error) throw new Error(error.message);
}

// Admin değilse veya aktif oturum yoksa null döner (hata fırlatmaz) —
// bkz. lib/db/schoolContext.js:getSchoolForUser, her dashboard
// yüklemesinde sorulur.
export async function getActiveImpersonation(supabase) {
  const { data, error } = await supabase.rpc('platform_get_active_impersonation');
  if (error) throw new Error(error.message);
  return data?.[0] || null;
}
