// Süper admin RPC çağrıları — tüm gerçek yetki kontrolü ve çapraz-okul
// erişimi DB tarafında (SECURITY DEFINER fonksiyonlar, bkz.
// supabase/migrations/0016_super_admin.sql) yapılıyor; bu dosya sadece
// o fonksiyonları çağırıyor (CLAUDE.md mimari kural 2).

export async function isPlatformAdmin(supabase) {
  const { data, error } = await supabase.rpc('platform_is_admin');
  if (error) throw new Error(error.message);
  return data === true;
}

export async function requirePlatformAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapılmamış.');
  const isAdmin = await isPlatformAdmin(supabase);
  if (!isAdmin) throw new Error('Yetkiniz yok.');
}

export async function getPlatformSchools(supabase) {
  const { data, error } = await supabase.rpc('platform_list_schools');
  if (error) throw new Error(error.message);
  return data;
}

export async function extendSchoolTrial(supabase, schoolId, days) {
  const { error } = await supabase.rpc('platform_extend_trial', { p_school_id: schoolId, p_days: days });
  if (error) throw new Error(error.message);
}

export async function setSchoolSubscription(supabase, schoolId, { status, planType, trialEndsAt, currentPeriodEnd }) {
  const { error } = await supabase.rpc('platform_set_subscription', {
    p_school_id: schoolId,
    p_status: status,
    p_plan_type: planType,
    p_trial_ends_at: trialEndsAt || null,
    p_current_period_end: currentPeriodEnd || null,
  });
  if (error) throw new Error(error.message);
}

export async function freezeSchool(supabase, schoolId) {
  const { error } = await supabase.rpc('platform_freeze_school', { p_school_id: schoolId });
  if (error) throw new Error(error.message);
}
