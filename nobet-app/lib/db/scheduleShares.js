// schedule_shares tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2). Premium kontrolü hem burayı çağıran action'da hem de
// create_schedule_share SQL fonksiyonunun içinde tekrarlanır (savunma
// amaçlı, bkz. supabase/migrations/0017_feature_gating.sql).

export async function createShare(supabase, { startDate, endDate }) {
  const { data, error } = await supabase.rpc('create_schedule_share', {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw new Error(error.message);
  return data; // token
}

export async function removeShare(supabase, schoolId) {
  const { error } = await supabase.from('schedule_shares').delete().eq('school_id', schoolId);
  if (error) throw new Error(error.message);
}

export async function getActiveShare(supabase, schoolId) {
  const { data, error } = await supabase
    .from('schedule_shares')
    .select('token, start_date, end_date, expires_at')
    .eq('school_id', schoolId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Herkese açık (girişsiz) paylaşım sayfası için — token'ı dar kapsamlı
// SECURITY DEFINER fonksiyona sorar, RLS'i hiçbir tablo üzerinde atlamaz.
export async function getPublicSchedule(supabase, token) {
  const { data, error } = await supabase.rpc('get_public_schedule', { p_token: token });
  if (error) throw new Error(error.message);
  return data;
}
