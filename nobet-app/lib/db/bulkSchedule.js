// Scheduling Engine'in toplu üretim ucu. Bir tarih aralığı + okuldaki
// tüm aktif bölgeler için otomatik atama üretir. lib/db/scheduling.js
// (tekil bölge+tarih) ile karıştırılmamalı — bu dosya bir defada
// gerekli TÜM veriyi çekip bellek içinde döngü kurar, çünkü tekil
// pipeline'ı gün×bölge kadar tekrar tekrar çağırmak hem çok yavaş hem
// de "sürekli bellek içi adillik" garantisini bozar.

import { getTeachers } from './teachers';
import { getDutyZones } from './dutyZones';
import { getUnavailableWeekdaysForTeachers } from './teacherAvailability';
import { getZoneClosuresForZones } from './zoneClosures';
import { getCalendarDays } from './calendarDays';
import {
  deleteAutoAssignmentsInRange,
  createAssignments,
  getTotalAssignmentCounts,
} from './dutyAssignments';
import { checkHardRules } from '@/lib/engine/rules';
import { getWeekday } from '@/lib/engine/weekday';
import { selectFairest } from '@/lib/engine/selectFairest';
import { eachDateStr, isSchedulableDay } from '@/lib/engine/scheduler';

export async function generateBulkSchedule(supabase, { schoolId, startDate, endDate }) {
  // 1) İdempotency: bu aralıktaki eski otomatik atamaları temizle,
  // elle düzenlenmiş (is_manual=true) satırlara dokunma.
  await deleteAutoAssignmentsInRange(supabase, schoolId, startDate, endDate);

  // 2) Gerekli tüm veriyi bir kez çek.
  const [allTeachers, allZones, calendarDays] = await Promise.all([
    getTeachers(supabase, schoolId),
    getDutyZones(supabase, schoolId),
    getCalendarDays(supabase, schoolId, startDate, endDate),
  ]);
  const teachers = allTeachers.filter((t) => t.is_active);
  const zones = allZones.filter((z) => z.is_active);

  const teacherIds = teachers.map((t) => t.id);
  const zoneIds = zones.map((z) => z.id);

  const [unavailableByTeacher, closuresByZone, dutyCountByTeacher] = await Promise.all([
    getUnavailableWeekdaysForTeachers(supabase, teacherIds),
    getZoneClosuresForZones(supabase, zoneIds),
    // Silme sonrası kalan veriden başlar (selectFairest'in "tüm
    // zamanlar" adillik tanımıyla tutarlı, sıfırdan başlamaz).
    getTotalAssignmentCounts(supabase, schoolId),
  ]);

  const calendarByDate = Object.fromEntries(calendarDays.map((c) => [c.calendar_date, c]));

  // 3) Gün gün, bölge bölge bellek içi üretim.
  const newAssignments = [];

  for (const date of eachDateStr(startDate, endDate)) {
    const weekday = getWeekday(date);
    if (!isSchedulableDay({ weekday, calendarDay: calendarByDate[date] })) continue;

    // Aynı öğretmenin aynı günde farklı bölgelere (double-duty izni
    // olmadan) atanmasını engellemek için günlük sayaç — checkHardRules'a
    // her zone denemesinde güncel existingAssignmentCountForDate verir.
    const dailyCounts = {};

    for (const zone of zones) {
      const candidates = teachers
        .map((teacher) => ({
          teacher,
          result: checkHardRules({
            teacher,
            zone,
            unavailableWeekdays: unavailableByTeacher[teacher.id] || [],
            closures: closuresByZone[zone.id] || [],
            date,
            weekday,
            existingAssignmentCountForDate: dailyCounts[teacher.id] || 0,
          }),
        }))
        .filter((c) => c.result.eligible)
        .map((c) => ({ teacher: c.teacher, dutyCount: dutyCountByTeacher[c.teacher.id] || 0 }));

      const selected = selectFairest(candidates, zone.required_count);

      for (const s of selected) {
        newAssignments.push({ teacherId: s.teacher.id, zoneId: zone.id, date });
        dutyCountByTeacher[s.teacher.id] = (dutyCountByTeacher[s.teacher.id] || 0) + 1;
        dailyCounts[s.teacher.id] = (dailyCounts[s.teacher.id] || 0) + 1;
      }
    }
  }

  // 4) Tek toplu yazma.
  const created = await createAssignments(supabase, schoolId, newAssignments);
  return { createdCount: created.length };
}
