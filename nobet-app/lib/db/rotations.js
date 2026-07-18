// rotations tablosuna dokunan sorgular. Component/action'lar Supabase'i
// doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md mimari kural 2).

export async function getRotationsByMode(supabase, schoolId, rotationMode) {
  const { data, error } = await supabase
    .from('rotations')
    .select('*')
    .eq('school_id', schoolId)
    .eq('rotation_mode', rotationMode);
  if (error) throw new Error(error.message);
  return data;
}

export async function getRotationForTeacher(supabase, teacherId) {
  const { data, error } = await supabase
    .from('rotations')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Bir öğretmeni rotasyona dahil eder (rotations.unique(teacher_id) —
// bir öğretmenin tek bir aktif rotasyon durumu olur). Cursor'lar 0'dan
// başlar: okulun aktif bölgeleri listesindeki ilk bölgeden.
export async function createRotation(supabase, schoolId, teacherId, rotationMode) {
  const { data, error } = await supabase
    .from('rotations')
    .insert({ school_id: schoolId, teacher_id: teacherId, rotation_mode: rotationMode })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Bir öğretmeni rotasyondan çıkarır — bundan sonra tamamen basit
// adillikle (Faz B) atanır. Rotasyon geçmişi (cycle_count vb.) bu
// satırla birlikte kaybolur; kullanıcı tekrar dahil ederse 0'dan başlar.
export async function deleteRotation(supabase, rotationId) {
  const { error } = await supabase.from('rotations').delete().eq('id', rotationId);
  if (error) throw new Error(error.message);
}

// Bir haftalık üretim turu bittiğinde cursor'ı bir ileri sarar
// (zone_cursor döngüsel — okulun aktif bölge sayısını aşarsa başa
// döner, cycle_count sarma anını sayar, last_advanced hangi haftaya
// kadar ilerletildiğini kayıt altına alır — rotasyon geçmişi bu
// alanlardan yeniden kurulabilir).
export async function advanceRotation(supabase, rotationId, { zoneCursor, cycleCount, lastAdvanced }) {
  const { error } = await supabase
    .from('rotations')
    .update({ zone_cursor: zoneCursor, cycle_count: cycleCount, last_advanced: lastAdvanced })
    .eq('id', rotationId);
  if (error) throw new Error(error.message);
}
