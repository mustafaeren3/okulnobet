// zone_closures tablosuna dokunan sorgular. Component/action'lar Supabase'i
// doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md mimari kural 2).

export async function getZoneClosures(supabase, zoneId) {
  const { data, error } = await supabase
    .from('zone_closures')
    .select('*')
    .eq('zone_id', zoneId);
  if (error) throw new Error(error.message);
  return data;
}
