// Oturum sahibi kullanıcının bağlı olduğu okulu çözer (school_users +
// schools join). Component/page ve server action'lar okul bağlamına
// buradan ulaşır, doğrudan Supabase sorgusu yazmaz (CLAUDE.md mimari
// kural 2 — bu kural server action'lar için de geçerli, sadece
// component/page değil).

export async function getSchoolForUser(supabase, userId) {
  const { data, error } = await supabase
    .from('school_users')
    .select('school_id, schools(name)')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { schoolId: data.school_id, schoolName: data.schools?.name };
}

export async function requireSchoolId(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapılmamış.');
  const school = await getSchoolForUser(supabase, user.id);
  if (!school) throw new Error('Kullanıcı bir okula bağlı değil.');
  return school.schoolId;
}
