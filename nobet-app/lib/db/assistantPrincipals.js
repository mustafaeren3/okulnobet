// assistant_principals tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2). lib/db/teachers.js ile aynı CRUD deseni.

export async function getAssistantPrincipals(supabase, schoolId) {
  const { data, error } = await supabase
    .from('assistant_principals')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return data;
}

export async function createAssistantPrincipal(supabase, schoolId, { fullName }) {
  const { data, error } = await supabase
    .from('assistant_principals')
    .insert({ school_id: schoolId, full_name: fullName })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAssistantPrincipal(supabase, id, patch) {
  const { data, error } = await supabase
    .from('assistant_principals')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAssistantPrincipal(supabase, id) {
  const { error } = await supabase.from('assistant_principals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
