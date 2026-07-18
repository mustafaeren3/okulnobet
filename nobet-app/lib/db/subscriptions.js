// subscriptions tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2). Yazma izni yok — satırlar sadece register_school
// (SECURITY DEFINER) tarafından oluşturuluyor, bkz.
// supabase/migrations/0010_subscriptions.sql.

export async function getSubscriptionForSchool(supabase, schoolId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('school_id', schoolId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
