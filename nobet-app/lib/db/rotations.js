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
