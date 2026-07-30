// teachers tablosuna dokunan tüm sorgular. Component/action'lar Supabase'i
// doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md mimari kural 2).

export async function getTeachers(supabase, schoolId) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('school_id', schoolId)
    .order('full_name');
  if (error) throw new Error(error.message);
  return data;
}

export async function getTeacherById(supabase, teacherId) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', teacherId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createTeacher(supabase, schoolId, teacher) {
  const { data, error } = await supabase
    .from('teachers')
    .insert({
      school_id: schoolId,
      full_name: teacher.full_name,
      branch: teacher.branch,
      weekly_capacity: teacher.weekly_capacity ?? 1,
      allow_double_duty: teacher.allow_double_duty ?? false,
      restriction_mode: teacher.restriction_mode ?? 'ALL',
      fixed_zone_id: teacher.fixed_zone_id ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTeacher(supabase, teacherId, patch) {
  const { data, error } = await supabase
    .from('teachers')
    .update(patch)
    .eq('id', teacherId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTeacher(supabase, teacherId) {
  const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
  if (error) throw new Error(error.message);
}

export async function createTeachersBulk(supabase, schoolId, teachers) {
  if (!teachers.length) return [];
  const rows = teachers.map((t) => ({
    school_id: schoolId,
    full_name: t.full_name,
    branch: t.branch,
    weekly_capacity: t.weekly_capacity ?? 1,
    allow_double_duty: t.allow_double_duty ?? false,
    restriction_mode: t.restriction_mode ?? 'ALL',
  }));
  const { data, error } = await supabase.from('teachers').insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}
