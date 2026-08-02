// duty_assignments tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2).

import { getWeekStart, addDays } from '@/lib/engine/rotation';
import { assertBelongsToSchool } from './ownership';

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

// Bir okulun, verilen tarihin HAFTASINDAKİ (Pzt-Paz) tüm atamalarını
// teacherId → sayı olarak döndürür — max_duty_per_week hard rule'ının
// tekil atama yolundaki (eligibility) veri kaynağı.
export async function getAssignmentCountsForWeek(supabase, schoolId, date) {
  const weekStart = getWeekStart(date);
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('teacher_id')
    .eq('school_id', schoolId)
    .gte('duty_date', weekStart)
    .lte('duty_date', addDays(weekStart, 6));
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

// İdarecinin elle eklediği bir atama — is_manual=true, Scheduling
// Engine (generateBulkSchedule) bir daha dokunmaz (silme adımı sadece
// is_manual=false satırları hedefliyor). teacherId/zoneId insert'ten ÖNCE
// aynı okula ait mi diye doğrulanır (kalite denetimi bulgusu — bkz.
// lib/db/ownership.js, normal UI akışında imkansız ama doğrudan action
// çağrısına karşı savunma).
export async function createManualAssignment(supabase, schoolId, { teacherId, zoneId, date, slotKey }) {
  await assertBelongsToSchool(supabase, 'teachers', teacherId, schoolId, 'Öğretmen');
  await assertBelongsToSchool(supabase, 'duty_zones', zoneId, schoolId, 'Nöbet yeri');

  const { data, error } = await supabase
    .from('duty_assignments')
    .insert({
      school_id: schoolId,
      teacher_id: teacherId,
      zone_id: zoneId,
      duty_date: date,
      slot_key: slotKey ?? 'full_day',
      is_manual: true,
    })
    .select('id, duty_date, is_manual, teachers(id, full_name), duty_zones(id, name, priority, created_at)')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAssignment(supabase, assignmentId) {
  const { error } = await supabase.from('duty_assignments').delete().eq('id', assignmentId);
  if (error) throw new Error(error.message);
}

// Bir atamadaki öğretmeni ATOMİK olarak değiştirir — tek bir SQL
// fonksiyonu (swap_duty_assignment, bkz. supabase/migrations/0042)
// içinde sil+ekle, tek transaction. İkinci adım (ekleme) unique
// constraint'e çarparsa TÜM işlem rollback olur, eski atama kalır —
// önceki iki-istekli (removeAssignment + addManualAssignment) akışın
// "ikinci istek başarısız olursa hücre boş kalır" riskini ortadan
// kaldırır. Yeni öğretmenin okula ait olduğu SQL fonksiyonunun içinde
// doğrulanıyor.
export async function swapAssignment(supabase, assignmentId, newTeacherId) {
  // .select() BİLEREK yok — RPC zaten RETURNS TABLE ile tam istenen
  // satırı döndürüyor; .select() eklemek PostgREST'in fonksiyon sonucunu
  // yeniden sorgulamaya çalışmasına ve "column reference is ambiguous"
  // hatasına yol açıyordu (canlıda doğrulandı).
  const { data, error } = await supabase
    .rpc('swap_duty_assignment', { p_assignment_id: assignmentId, p_new_teacher_id: newTeacherId })
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    duty_date: data.duty_date,
    is_manual: data.is_manual,
    teachers: { id: data.teacher_id, full_name: data.teacher_full_name },
    duty_zones: { id: data.zone_id, name: data.zone_name },
  };
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
    .select('id, duty_date, is_manual, teachers(id, full_name), duty_zones(id, name, priority, created_at)')
    .eq('school_id', schoolId)
    .gte('duty_date', startDate)
    .lte('duty_date', endDate)
    .order('duty_date');
  if (error) throw new Error(error.message);
  return data;
}

// Bir okulun, verilen tarihten ÖNCEKİ en son atama gününü döndürür
// (yoksa null). Toplu üretimin rotasyon çapası: "DB'deki son üretilmiş
// hafta/ay hangisi, sıra oradan devam etsin" sorusuna cevap verir.
export async function getLatestAssignmentDateBefore(supabase, schoolId, dateStr) {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('duty_date')
    .eq('school_id', schoolId)
    .lt('duty_date', dateStr)
    .order('duty_date', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data[0]?.duty_date ?? null;
}

// Bir okulun EN ERKEN atama gününü döndürür (yoksa null). Feature
// gating'in "açık ay" tanımı bu tarihin ayı — okulun hiç generate
// ettiği ilk aralığın ilk ayı, hangi tarihte/kaç kez tekrar üretim
// yapılırsa yapılsın SABİT kalır (bkz. lib/engine/access.js
// getUnlockedMonthKey, app/(wizard)/schedule/actions.js).
export async function getEarliestAssignmentDate(supabase, schoolId) {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('duty_date')
    .eq('school_id', schoolId)
    .order('duty_date', { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  return data[0]?.duty_date ?? null;
}

// Yıllık Dağılım görünümünün veri kaynağı — kalite denetimi bulgusu:
// önceki hali (getAllAssignmentsForSchool) TÜM ham duty_assignments
// satırlarını tarih filtresiz çekiyordu, PostgREST'in varsayılan 1000
// satır limitine sessizce takılabiliyordu. Artık aggregasyon Postgres'te
// yapılıyor (get_yearly_distribution RPC, bkz. supabase/migrations/0040):
// istemciye SADECE (öğretmen × ay) kırılımındaki SAYIMLAR geliyor — bu
// sonuç kümesi ham nöbet sayısından (binlerce olabilir) BAĞIMSIZ, öğretmen
// sayısı × ay sayısı ile sınırlı (tipik bir okulda birkaç yüz satır),
// pratikte 1000 satır sınırına hiç yaklaşmaz. RPC parametre almıyor —
// current_school_id() ile kendi kapsamını belirliyor (bkz. RLS'in aynı
// deseni), bu yüzden schoolId burada kullanılmıyor (fonksiyon imzasında
// tutarlılık için duruyor, çağıran yine de okulunu requireSchoolId ile
// doğrulamış oluyor).
export async function getYearlyDistribution(supabase) {
  const { data, error } = await supabase.rpc('get_yearly_distribution');
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
