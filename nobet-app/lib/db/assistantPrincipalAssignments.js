// assistant_principal_assignments tablosuna dokunan sorgular (bkz.
// supabase/migrations/0039). lib/db/dutyAssignments.js'in ilgili alt
// kümesiyle birebir desen — zone kavramı yok, günde tek kişi.

import { assertBelongsToSchool } from './ownership';

export async function createAssignments(supabase, schoolId, assignments) {
  if (!assignments.length) return [];
  const rows = assignments.map((a) => ({
    school_id: schoolId,
    assistant_principal_id: a.personId,
    duty_date: a.date,
  }));
  const { data, error } = await supabase.from('assistant_principal_assignments').insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}

// personId insert'ten ÖNCE aynı okula ait mi diye doğrulanır (kalite
// denetimi bulgusu — bkz. lib/db/ownership.js). UPSERT (school_id,
// duty_date) çakışmasında tek statement'ta çalışır — hem "boş güne
// ekleme" hem "mevcut günün kişisini değiştirme" ZATEN atomik, ayrı bir
// swap RPC'sine gerek yok (öğretmen motorundaki iki-istekli akıştan
// farklı olarak buradaki tek istek zaten tek transaction).
export async function createManualAssignment(supabase, schoolId, { personId, date }) {
  await assertBelongsToSchool(supabase, 'assistant_principals', personId, schoolId, 'Görevli müdür yardımcısı');

  const { data, error } = await supabase
    .from('assistant_principal_assignments')
    .upsert(
      { school_id: schoolId, assistant_principal_id: personId, duty_date: date, is_manual: true },
      { onConflict: 'school_id,duty_date' },
    )
    .select('id, duty_date, is_manual, assistant_principals(id, full_name)')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAssignment(supabase, assignmentId) {
  const { error } = await supabase.from('assistant_principal_assignments').delete().eq('id', assignmentId);
  if (error) throw new Error(error.message);
}

// Bir okulun [startDate, endDate] aralığındaki OTOMATİK (is_manual=false)
// atamalarını siler. generateAssistantPrincipalSchedule'ın idempotency
// stratejisi — duty_assignments'taki deleteAutoAssignmentsInRange ile aynı.
export async function deleteAutoAssignmentsInRange(supabase, schoolId, startDate, endDate) {
  const { error } = await supabase
    .from('assistant_principal_assignments')
    .delete()
    .eq('school_id', schoolId)
    .eq('is_manual', false)
    .gte('duty_date', startDate)
    .lte('duty_date', endDate);
  if (error) throw new Error(error.message);
}

export async function getAssignmentsForRange(supabase, schoolId, startDate, endDate) {
  const { data, error } = await supabase
    .from('assistant_principal_assignments')
    .select('id, duty_date, is_manual, assistant_principals(id, full_name)')
    .eq('school_id', schoolId)
    .gte('duty_date', startDate)
    .lte('duty_date', endDate)
    .order('duty_date');
  if (error) throw new Error(error.message);
  return data;
}

// Bir okulun, verilen tarihten ÖNCEKİ en son atama gününü ve o günün
// kişisini döndürür (yoksa null) — rotasyonun kaldığı yerden devam etmesi
// için çapa (bkz. lib/db/assistantPrincipalSchedule.js).
export async function getLatestAssignmentBefore(supabase, schoolId, dateStr) {
  const { data, error } = await supabase
    .from('assistant_principal_assignments')
    .select('duty_date, assistant_principal_id')
    .eq('school_id', schoolId)
    .lt('duty_date', dateStr)
    .order('duty_date', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data[0] ?? null;
}

// throughDate'e kadar (dahil) en son atamalardan geriye doğru, AYNI
// kişiye ait kaç ARDIŞIK gün olduğunu sayar (en fazla `limit` satır
// bakılır). n_day_block rotasyonunun "bu kişi bloğun kaçıncı gününde"
// durumunu DB'den yeniden kurmak için — bkz. assistantPrincipalSchedule.js.
export async function countTrailingAssignmentsForPerson(supabase, schoolId, throughDate, personId, limit) {
  const { data, error } = await supabase
    .from('assistant_principal_assignments')
    .select('assistant_principal_id, duty_date')
    .eq('school_id', schoolId)
    .lte('duty_date', throughDate)
    .order('duty_date', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  let count = 0;
  for (const row of data) {
    if (row.assistant_principal_id !== personId) break;
    count++;
  }
  return count;
}
