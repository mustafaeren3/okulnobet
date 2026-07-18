// duty_zones tablosuna dokunan tüm sorgular. Component/action'lar Supabase'i
// doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md mimari kural 2).

export async function getDutyZones(supabase, schoolId) {
  const { data, error } = await supabase
    .from('duty_zones')
    .select('*')
    .eq('school_id', schoolId)
    .order('priority', { ascending: false })
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

export async function createDutyZone(supabase, schoolId, zone) {
  const { data, error } = await supabase
    .from('duty_zones')
    .insert({
      school_id: schoolId,
      name: zone.name,
      required_count: zone.required_count ?? 1,
      active_days: zone.active_days ?? [1, 2, 3, 4, 5],
      allowed_branches: zone.allowed_branches ?? null,
      blocked_branches: zone.blocked_branches ?? null,
      priority: zone.priority ?? 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDutyZone(supabase, zoneId, patch) {
  const { data, error } = await supabase
    .from('duty_zones')
    .update(patch)
    .eq('id', zoneId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDutyZone(supabase, zoneId) {
  const { error } = await supabase.from('duty_zones').delete().eq('id', zoneId);
  if (error) throw new Error(error.message);
}
