// calendar_days tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2).

export async function getCalendarDays(supabase, schoolId, startDate, endDate) {
  const { data, error } = await supabase
    .from('calendar_days')
    .select('*')
    .eq('school_id', schoolId)
    .gte('calendar_date', startDate)
    .lte('calendar_date', endDate);
  if (error) throw new Error(error.message);
  return data;
}
