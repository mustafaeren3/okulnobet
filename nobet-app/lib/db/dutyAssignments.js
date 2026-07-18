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

// Bir okulun bir tarihteki tüm atamalarını tek sorguda çekip
// teacherId → atama sayısı eşleşen bir obje döndürür. Aday tarama gibi
// çok-öğretmenli akışlarda öğretmen başına ayrı count sorgusu yerine kullanılır.
export async function getAssignmentCountsForDate(supabase, schoolId, date) {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('teacher_id')
    .eq('school_id', schoolId)
    .eq('duty_date', date);
  if (error) throw new Error(error.message);
  return data.reduce((map, row) => {
    map[row.teacher_id] = (map[row.teacher_id] || 0) + 1;
    return map;
  }, {});
}
