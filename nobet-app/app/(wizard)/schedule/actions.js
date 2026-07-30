'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSchoolId, setSchoolRotationMode, updateSchoolProfileFields } from '@/lib/db/schoolContext';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';
import { getAssignmentsForRange, createManualAssignment, deleteAssignment } from '@/lib/db/dutyAssignments';
import { getTeachers } from '@/lib/db/teachers';
import { getHolidays, upsertHolidays, deleteCalendarDay } from '@/lib/db/calendarDays';
import { ACADEMIC_YEAR_2026_2027_HOLIDAYS } from '@/lib/engine/holidays';

export async function runBulkSchedule(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    const result = await generateBulkSchedule(supabase, { schoolId, startDate, endDate });
    const rows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
    revalidatePath('/dashboard');
    return { ...result, rows };
  } catch (e) {
    return { error: e.message };
  }
}

// Gerçek üretimden ÖNCE çağrılır: DB'ye hiç dokunmadan aynı motoru
// çalıştırıp hangi (gün, bölge) hücrelerinin öğretmen yetersizliğinden
// BOŞ kalacağını döner — idareci "Program Oluştur"a basmadan önce
// bunu görüp onaylar/vazgeçer.
export async function previewBulkSchedule(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    const result = await generateBulkSchedule(supabase, { schoolId, startDate, endDate, dryRun: true });
    return { emptySlots: result.emptySlots };
  } catch (e) {
    return { error: e.message };
  }
}

// Okulun dönme düzenini değiştirir. Sıra durumu saklanmadığı (DB'deki
// son üretilmiş haftadan türetildiği) için mod değişikliği bir sonraki
// "Program Oluştur"da kendiliğinden geçerli olur.
export async function updateRotationMode(mode) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!['haftalik_yer', 'aylik_ayni_gun', 'aylik_farkli_gun'].includes(mode)) {
      throw new Error('Geçersiz dönme düzeni.');
    }
    await setSchoolRotationMode(supabase, schoolId, mode);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function updateSchoolPrincipalName(name) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    await updateSchoolProfileFields(supabase, schoolId, { principal_name: name.trim() });
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function updateSchoolAssistantPrincipalName(name) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    await updateSchoolProfileFields(supabase, schoolId, { assistant_principal_name: name.trim() });
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchScheduleView(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    const rows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
    return { rows };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchTeacherOptions() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const teachers = await getTeachers(supabase, schoolId);
    return { teachers: teachers.filter((t) => t.is_active) };
  } catch (e) {
    return { error: e.message };
  }
}

export async function addManualAssignment({ teacherId, zoneId, date }) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const row = await createManualAssignment(supabase, schoolId, { teacherId, zoneId, date });
    revalidatePath('/dashboard');
    return { row };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeAssignment(assignmentId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    await deleteAssignment(supabase, assignmentId);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

// ── Tatil yönetimi (calendar_days, day_type='holiday') ──────────────
// Eski paneldeki tatil özelliği buraya taşındı — artık motorun GERÇEKTEN
// okuduğu tabloya (calendar_days) yazar; eski `holidays` tablosunu motor
// hiç görmüyordu.

export async function fetchHolidays() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const holidays = await getHolidays(supabase, schoolId);
    return { holidays };
  } catch (e) {
    return { error: e.message };
  }
}

export async function addHoliday(date, description) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!date) throw new Error('Tarih giriniz.');
    await upsertHolidays(supabase, schoolId, [{ date, description: description?.trim() || 'Tatil' }]);
    const holidays = await getHolidays(supabase, schoolId);
    revalidatePath('/dashboard');
    return { holidays };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeHoliday(calendarDayId) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    await deleteCalendarDay(supabase, calendarDayId);
    const holidays = await getHolidays(supabase, schoolId);
    revalidatePath('/dashboard');
    return { holidays };
  } catch (e) {
    return { error: e.message };
  }
}

export async function loadDefaultHolidays() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const rows = Object.entries(ACADEMIC_YEAR_2026_2027_HOLIDAYS).map(([date, description]) => ({ date, description }));
    await upsertHolidays(supabase, schoolId, rows);
    const holidays = await getHolidays(supabase, schoolId);
    revalidatePath('/dashboard');
    return { holidays, loadedCount: rows.length };
  } catch (e) {
    return { error: e.message };
  }
}
