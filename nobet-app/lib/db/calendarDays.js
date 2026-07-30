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

// Bir okulun tüm tatil günlerini (day_type='holiday') tarih sırasıyla
// döndürür — tatil yönetimi UI'ının listesi.
export async function getHolidays(supabase, schoolId) {
  const { data, error } = await supabase
    .from('calendar_days')
    .select('*')
    .eq('school_id', schoolId)
    .eq('day_type', 'holiday')
    .order('calendar_date');
  if (error) throw new Error(error.message);
  return data;
}

// Tatil günlerini toplu ekler/günceller. rows: [{date, description}].
// unique(school_id, calendar_date) sayesinde tekrar yüklemek güvenli
// (var olan gün üzerine yazılır, kopya oluşmaz).
export async function upsertHolidays(supabase, schoolId, rows) {
  const payload = rows.map((r) => ({
    school_id: schoolId,
    calendar_date: r.date,
    day_type: 'holiday',
    description: r.description ?? null,
  }));
  const { data, error } = await supabase
    .from('calendar_days')
    .upsert(payload, { onConflict: 'school_id,calendar_date' })
    .select();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCalendarDay(supabase, calendarDayId) {
  const { error } = await supabase.from('calendar_days').delete().eq('id', calendarDayId);
  if (error) throw new Error(error.message);
}
