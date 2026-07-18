// teacher_unavailable_days tablosuna dokunan sorgular. Bu tablo sadece
// weekday tutar; anlamı teachers.restriction_mode'a göre değişir
// (bkz. supabase/migrations/0004_teachers_and_zones.sql yorumu).

export async function getUnavailableWeekdays(supabase, teacherId) {
  const { data, error } = await supabase
    .from('teacher_unavailable_days')
    .select('weekday')
    .eq('teacher_id', teacherId)
    .order('weekday');
  if (error) throw new Error(error.message);
  return data.map((row) => row.weekday);
}

// Birden fazla öğretmenin unavailable weekday listesini tek sorguda
// çeker, teacherId → weekday[] eşleşen bir obje döndürür. Aday tarama
// gibi çok-öğretmenli akışlarda öğretmen başına ayrı sorgu yerine kullanılır.
export async function getUnavailableWeekdaysForTeachers(supabase, teacherIds) {
  if (!teacherIds.length) return {};
  const { data, error } = await supabase
    .from('teacher_unavailable_days')
    .select('teacher_id, weekday')
    .in('teacher_id', teacherIds);
  if (error) throw new Error(error.message);
  return data.reduce((map, row) => {
    (map[row.teacher_id] ??= []).push(row.weekday);
    return map;
  }, {});
}

// Öğretmenin gün listesini tamamen değiştirir (var olanları silip yeniden
// ekler). restriction_mode 'ALL' ise weekdays boş dizi gönderilmeli.
export async function setUnavailableWeekdays(supabase, schoolId, teacherId, weekdays) {
  const { error: delError } = await supabase
    .from('teacher_unavailable_days')
    .delete()
    .eq('teacher_id', teacherId);
  if (delError) throw new Error(delError.message);

  if (!weekdays.length) return [];

  const rows = weekdays.map((weekday) => ({ school_id: schoolId, teacher_id: teacherId, weekday }));
  const { data, error } = await supabase.from('teacher_unavailable_days').insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}
