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

// Birden fazla bölgenin kapanış listesini tek sorguda çeker, zoneId →
// closure[] eşleşen bir obje döndürür. Toplu program üretimi gibi
// çok-bölgeli akışlarda bölge başına ayrı sorgu yerine kullanılır.
export async function getZoneClosuresForZones(supabase, zoneIds) {
  if (!zoneIds.length) return {};
  const { data, error } = await supabase
    .from('zone_closures')
    .select('*')
    .in('zone_id', zoneIds);
  if (error) throw new Error(error.message);
  return data.reduce((map, row) => {
    (map[row.zone_id] ??= []).push(row);
    return map;
  }, {});
}
