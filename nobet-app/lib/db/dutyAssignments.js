// duty_assignments tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2).

export async function getAssignmentCountForTeacherDate(supabase, teacherId, date) {
  const { count, error } = await supabase
    .from('duty_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .eq('duty_date', date);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
