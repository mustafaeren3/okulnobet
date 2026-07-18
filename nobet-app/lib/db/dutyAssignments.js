// duty_assignments tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2).

export async function getAssignmentCountForTeacherDate(supabase, teacherId, date) {
  const { count, error } = await supabase
    .from('duty_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .eq('duty_date', date);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// Bir okulun bir tarihteki tüm atamalarını tek sorguda çekip
// teacherId → atama sayısı eşleşen bir obje döndürür. Aday tarama gibi
// çok-öğretmenli akışlarda öğretmen başına ayrı count sorgusu yerine kullanılır.
export async function getAssignmentCountsForDate(supabase, schoolId, date) {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('teacher_id')
    .eq('school_id', schoolId)
    .eq('duty_date', date);
  if (error) throw new Error(error.message);
  return data.reduce((map, row) => {
    map[row.teacher_id] = (map[row.teacher_id] || 0) + 1;
    return map;
  }, {});
}

// Bir veya daha fazla ataması tek sorguda kaydeder. is_manual=false
// (varsayılan) — motorun ürettiği atamalar Scheduling Engine tarafından
// üretildiğini belirtir; idarecinin elle düzenlediği satırlar ayrı bir
// akışta is_manual=true ile işaretlenecek (henüz yazılmadı).
// unique(teacher_id, duty_date, slot_key, zone_id) kısıtı zaten kopya
// atamayı engelliyor (bkz. supabase/migrations/0009).
export async function createAssignments(supabase, schoolId, assignments) {
  if (!assignments.length) return [];
  const rows = assignments.map((a) => ({
    school_id: schoolId,
    teacher_id: a.teacherId,
    zone_id: a.zoneId,
    duty_date: a.date,
    slot_key: a.slotKey ?? 'full_day',
  }));
  const { data, error } = await supabase.from('duty_assignments').insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}

// Bir okulun [startDate, endDate] aralığındaki OTOMATİK (is_manual=false)
// atamalarını siler. İdarecinin elle düzenlediği (is_manual=true) satırlara
// dokunmaz. Toplu program üretiminin idempotency stratejisi: yeniden
// üretmeden önce eski otomatik atamaları temizle, elle yapılan
// düzenlemeleri koru.
export async function deleteAutoAssignmentsInRange(supabase, schoolId, startDate, endDate) {
  const { error } = await supabase
    .from('duty_assignments')
    .delete()
    .eq('school_id', schoolId)
    .eq('is_manual', false)
    .gte('duty_date', startDate)
    .lte('duty_date', endDate);
  if (error) throw new Error(error.message);
}

// Bir okulun [startDate, endDate] aralığındaki atamalarını, öğretmen adı
// ve bölge adıyla birlikte (join) çeker. Program Görüntüleme ekranı için —
// idareci "kim hangi gün hangi bölgede" sorusuna cevap alır.
export async function getAssignmentsForRange(supabase, schoolId, startDate, endDate) {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('id, duty_date, is_manual, teachers(id, full_name), duty_zones(id, name)')
    .eq('school_id', schoolId)
    .gte('duty_date', startDate)
    .lte('duty_date', endDate)
    .order('duty_date');
  if (error) throw new Error(error.message);
  return data;
}

// Bir okulun TÜM zamanlardaki atamalarını (tarih filtresi yok) tek
// sorguda çekip teacherId → toplam atama sayısı eşleşen bir obje
// döndürür. selectFairest'in "o ana kadar en az nöbet tutan" adillik
// ölçütü için kullanılır.
export async function getTotalAssignmentCounts(supabase, schoolId) {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('teacher_id')
    .eq('school_id', schoolId);
  if (error) throw new Error(error.message);
  return data.reduce((map, row) => {
    map[row.teacher_id] = (map[row.teacher_id] || 0) + 1;
    return map;
  }, {});
}
