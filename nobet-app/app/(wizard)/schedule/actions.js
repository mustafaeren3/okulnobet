'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSchoolId, setSchoolRotationMode, updateSchoolProfileFields, getPrintPreferences } from '@/lib/db/schoolContext';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';
import {
  getAssignmentsForRange,
  createManualAssignment,
  deleteAssignment,
  getEarliestAssignmentDate,
  getYearlyDistribution,
  swapAssignment,
} from '@/lib/db/dutyAssignments';
import { getTeachers } from '@/lib/db/teachers';
import { getHolidays, upsertHolidays, deleteCalendarDay } from '@/lib/db/calendarDays';
import { ACADEMIC_YEAR_2026_2027_HOLIDAYS } from '@/lib/engine/holidays';
import { requireCanGenerateSchedule, getSubscriptionForSchool } from '@/lib/db/subscriptions';
import { createShare, removeShare } from '@/lib/db/scheduleShares';
import { isPremium, canAccessFeature, FEATURES, getUnlockedMonthKey, isMonthUnlocked } from '@/lib/engine/access';
import { buildYearlyDistribution } from '@/lib/engine/distribution';

// Bu okulun "açık ay" referansı — hiç generate edilmemişse null.
// Ücretsiz planda kilitli olmayan TEK ay budur, kaç kez yeniden
// üretilirse üretilsin sabit kalır (bkz. lib/db/dutyAssignments.js
// getEarliestAssignmentDate).
async function getUnlockedMonthKeyForSchool(supabase, schoolId) {
  const earliestDate = await getEarliestAssignmentDate(supabase, schoolId);
  return earliestDate ? getUnlockedMonthKey(earliestDate) : null;
}

export async function runBulkSchedule(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    // Faz 9: ücretsiz plan TOPLAM 1 kez tam üretim yapabilir — bu kısıt
    // motorun kendisinde değil (bkz. lib/db/subscriptions.js üzerindeki
    // not), burada, gerçek UI akışının girdiği noktada uygulanır.
    await requireCanGenerateSchedule(supabase, schoolId);

    const result = await generateBulkSchedule(supabase, { schoolId, startDate, endDate });

    const subscription = await getSubscriptionForSchool(supabase, schoolId);
    const unlockedMonthKey = await getUnlockedMonthKeyForSchool(supabase, schoolId);
    const unlockedMonth = result.months.find((m) => m.key === unlockedMonthKey);

    // Ücretsiz planda satır verisi (rows) sadece açık aya kırpılmış
    // gönderilir — ay sekmelerinin ETİKETLERİ (result.months) hassas
    // değil, ama gerçek atama verisi kilitli aylar için client'a HİÇ
    // gitmiyor (devtools'tan okunamasın diye, bkz. teknik plan notu).
    const rows = isPremium(subscription)
      ? await getAssignmentsForRange(supabase, schoolId, startDate, endDate)
      : unlockedMonth
        ? await getAssignmentsForRange(supabase, schoolId, unlockedMonth.firstDate, unlockedMonth.lastDate)
        : [];

    revalidatePath('/dashboard');
    return { ...result, rows, unlockedMonthKey };
  } catch (e) {
    return { error: e.message };
  }
}

// Gerçek üretimden ÖNCE çağrılır: DB'ye hiç dokunmadan aynı motoru
// çalıştırıp hangi (gün, bölge) hücrelerinin öğretmen yetersizliğinden
// BOŞ kalacağını döner — idareci "Program Oluştur"a basmadan önce
// bunu görüp onaylar/vazgeçer. "1 kez" kısıtı burada da uygulanır —
// aksi halde ücretsiz bir okul hakkını kullandıktan sonra hâlâ önizleme
// yapıp "Devam etmek istiyor musun?" diyaloğuna kadar ilerleyebilirdi.
export async function previewBulkSchedule(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    await requireCanGenerateSchedule(supabase, schoolId);

    const result = await generateBulkSchedule(supabase, { schoolId, startDate, endDate, dryRun: true });
    return { emptySlots: result.emptySlots };
  } catch (e) {
    return { error: e.message };
  }
}

// Program sekmesindeki ay sekmelerinin veri kaynağı. Kilitli bir ay
// istenirse veri HİÇ dönmez ({ locked: true }) — client'a gönderilmeyen
// veri devtools'tan da okunamaz.
export async function fetchScheduleMonth(monthKey) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!monthKey) throw new Error('Ay belirtilmedi.');

    const subscription = await getSubscriptionForSchool(supabase, schoolId);
    const unlockedMonthKey = await getUnlockedMonthKeyForSchool(supabase, schoolId);
    if (!isMonthUnlocked(monthKey, unlockedMonthKey, subscription)) {
      return { locked: true };
    }

    const [y, m] = monthKey.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const rows = await getAssignmentsForRange(supabase, schoolId, `${monthKey}-01`, `${monthKey}-${String(lastDay).padStart(2, '0')}`);
    return { rows };
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

// Serbest tarih aralığı sorgusu = "Geçmiş programlar" özelliği (idareci
// az önce üretilenin dışında bir aralık istiyor). Premium'a kilitli —
// bkz. lib/engine/access.js FEATURES.VIEW_HISTORY.
export async function fetchScheduleView(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    const subscription = await getSubscriptionForSchool(supabase, schoolId);
    if (!canAccessFeature(subscription, FEATURES.VIEW_HISTORY)) {
      return { locked: true, error: 'Bu özellik Premium\'e özel.' };
    }

    const rows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
    return { rows };
  } catch (e) {
    return { error: e.message };
  }
}

// Yıllık Dağılım görünümünün veri kaynağı — okulun ürettiği TÜM aylardaki
// atamaları birleştirip öğretmen bazında özet çıkarır (bkz. lib/engine/
// distribution.js). Premium'e kilitli: ücretsiz plan zaten Program
// sekmesinde tek bir ayı görebiliyor (Faz 9), yıllık görünüm bu sınırı
// dolaşmasın diye aynı FEATURES.VIEW_HISTORY kilidini kullanır — kilitliyse
// satır verisi hiç hesaplanmaz/gönderilmez.
export async function fetchYearlyDistribution() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const subscription = await getSubscriptionForSchool(supabase, schoolId);
    if (!canAccessFeature(subscription, FEATURES.VIEW_HISTORY)) {
      return { locked: true };
    }

    const [monthlyCountRows, teachers] = await Promise.all([
      getYearlyDistribution(supabase),
      getTeachers(supabase, schoolId),
    ]);
    const monthlyCounts = monthlyCountRows.map((r) => ({
      teacherId: r.teacher_id,
      fullName: r.full_name || '(silinmiş öğretmen)',
      monthKey: r.month_key,
      count: r.duty_count,
    }));
    const distribution = buildYearlyDistribution(monthlyCounts, teachers.filter((t) => t.is_active));
    return { distribution };
  } catch (e) {
    return { error: e.message };
  }
}

// Yazdırma tercihi — schools.profile jsonb'de (updateSchoolProfileFields
// deseniyle, bkz. lib/db/schoolContext.js principal_name/assistant_
// principal_name). Bugün tek anahtar (assistantPrincipalColumnMode) ama
// patch nesnesi genel tutulduğu için ileride başka bir yazdırma tercihi
// eklenirse aynı fonksiyon yeniden kullanılır.
export async function updatePrintPreferences(patch) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (patch.assistantPrincipalColumnMode && !['same_table', 'separate_table'].includes(patch.assistantPrincipalColumnMode)) {
      throw new Error('Geçersiz yazdırma tercihi.');
    }
    const current = await getPrintPreferences(supabase, schoolId);
    await updateSchoolProfileFields(supabase, schoolId, { printPreferences: { ...current, ...patch } });
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

// Paylaşım bağlantısı — Premium'e özel (bkz. FEATURES.SHARE_SCHEDULE).
// DB seviyesindeki gerçek kontrol create_schedule_share SQL fonksiyonunda
// tekrarlanıyor (savunma amaçlı); buradaki kontrol kullanıcıya erken ve
// anlaşılır bir hata mesajı vermek için.
export async function createShareLink(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const subscription = await getSubscriptionForSchool(supabase, schoolId);
    if (!canAccessFeature(subscription, FEATURES.SHARE_SCHEDULE)) {
      return { locked: true, error: 'Paylaşım özelliği Premium\'e özel.' };
    }
    const token = await createShare(supabase, { startDate, endDate });
    return { token };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeShareLink() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    await removeShare(supabase, schoolId);
    return { ok: true };
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

// "Değiştir" — TEK bir atomik RPC çağrısı (swap_duty_assignment, bkz.
// supabase/migrations/0042). Kalite denetimi bulgusu: önceki hâli
// removeAssignment + addManualAssignment iki ayrı istekti, ikincisi
// başarısız olursa hücre boş kalıyordu. UI artık SADECE bu action'ı
// çağırıyor (Dashboard.jsx handleChangeEntry).
export async function changeAssignment(assignmentId, newTeacherId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    const row = await swapAssignment(supabase, assignmentId, newTeacherId);
    revalidatePath('/dashboard');
    return { row };
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
