// Scheduling Engine'in toplu üretim ucu. Bir tarih aralığı + okuldaki
// tüm aktif bölgeler için otomatik atama üretir. lib/db/scheduling.js
// (tekil bölge+tarih) ile karıştırılmamalı — bu dosya bir defada
// gerekli TÜM veriyi çekip bellek içinde döngü kurar, çünkü tekil
// pipeline'ı gün×bölge kadar tekrar tekrar çağırmak hem çok yavaş hem
// de "sürekli bellek içi adillik" garantisini bozar.
//
// İki fazda çalışır:
// Faz A — haftalık yer rotasyonu: rotations tablosunda
// rotation_mode='haftalik_yer' olan her öğretmen, bir hafta boyunca
// aynı bölgede kalır (zone_cursor, aktif bölgelerin öncelik sıralı
// listesindeki index'i gösterir), hafta bitince cursor ilerler ve
// kalıcı olarak kaydedilir (rotasyon geçmişi böyle korunur).
// Faz B — basit adillik: Faz A'dan sonra kalan boş slotlar, toplam
// nöbet sayısı en az olan uygun öğretmenlerle dolduruluyor (Faz 5'in
// önceki turlarında yazılan mevcut mantık, değişmedi).

import { getTeachers } from './teachers';
import { getDutyZones } from './dutyZones';
import { getUnavailableWeekdaysForTeachers } from './teacherAvailability';
import { getZoneClosuresForZones } from './zoneClosures';
import { getCalendarDays } from './calendarDays';
import { getRotationsByMode, advanceRotation } from './rotations';
import { getActiveHardRuleKeys } from './rules';
import { requireUsableSubscription } from './subscriptions';
import {
  deleteAutoAssignmentsInRange,
  createAssignments,
  getTotalAssignmentCounts,
  getAssignmentsForRange,
} from './dutyAssignments';
import { checkHardRules } from '@/lib/engine/rules';
import { getWeekday } from '@/lib/engine/weekday';
import { selectFairest } from '@/lib/engine/selectFairest';
import { eachDateStr, isSchedulableDay } from '@/lib/engine/scheduler';
import { groupDatesByWeek, getZoneForCursor } from '@/lib/engine/rotation';

export async function generateBulkSchedule(supabase, { schoolId, startDate, endDate }) {
  // 0) Deneme süresi dolmuş / aboneliği kullanılamaz okullar program
  // üretemez. En derin noktada kontrol edilir (savunma amaçlı).
  await requireUsableSubscription(supabase, schoolId);

  // 1) İdempotency: bu aralıktaki eski otomatik atamaları temizle,
  // elle düzenlenmiş (is_manual=true) satırlara dokunma.
  await deleteAutoAssignmentsInRange(supabase, schoolId, startDate, endDate);

  // 2) Gerekli tüm veriyi bir kez çek.
  const [allTeachers, allZones, calendarDays, weeklyRotations, activeRuleKeys] = await Promise.all([
    getTeachers(supabase, schoolId),
    getDutyZones(supabase, schoolId),
    getCalendarDays(supabase, schoolId, startDate, endDate),
    getRotationsByMode(supabase, schoolId, 'haftalik_yer'),
    getActiveHardRuleKeys(supabase, schoolId),
  ]);
  const teachers = allTeachers.filter((t) => t.is_active);
  const zones = allZones.filter((z) => z.is_active);
  const teachersById = Object.fromEntries(teachers.map((t) => [t.id, t]));
  const zonesById = Object.fromEntries(zones.map((z) => [z.id, z]));
  const activeZoneIds = zones.map((z) => z.id);

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

  // Silme adımından sonra aralıkta hâlâ satır varsa bunlar sadece
  // is_manual=true (elle eklenmiş) olabilir — otomatik olanlar zaten
  // silindi. Bunları hesaba katmazsak zaten dolu bir bölge/güne
  // gereğinden fazla öğretmen eklenir / o gün elle başka yere atanmış
  // bir öğretmen günlük limiti aşarak tekrar seçilebilir.
  const existingRows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
  const existingCountByDateZone = {};
  const existingTeacherIdsByDate = {};
  for (const row of existingRows) {
    const date = row.duty_date;
    const zoneId = row.duty_zones?.id;
    const teacherId = row.teachers?.id;
    (existingCountByDateZone[date] ??= {})[zoneId] = (existingCountByDateZone[date]?.[zoneId] || 0) + 1;
    (existingTeacherIdsByDate[date] ??= {})[teacherId] = (existingTeacherIdsByDate[date]?.[teacherId] || 0) + 1;
  }

  const schedulableDates = eachDateStr(startDate, endDate).filter((date) =>
    isSchedulableDay({ weekday: getWeekday(date), calendarDay: calendarByDate[date] })
  );

  // date -> zoneId -> dolu slot sayısı (elle yapılmışlar + bu turda
  // üretilenler). date -> teacherId -> o gün kaç nöbeti var (aynı,
  // günlük çift-nöbet limiti için).
  const assignedCountByDateZone = {};
  const dailyCountsByDate = {};
  function ensureZoneCounts(date) {
    return (assignedCountByDateZone[date] ??= { ...(existingCountByDateZone[date] || {}) });
  }
  function ensureDailyCounts(date) {
    return (dailyCountsByDate[date] ??= { ...(existingTeacherIdsByDate[date] || {}) });
  }

  const newAssignments = [];

  // ── Faz A: haftalık yer rotasyonu ──────────────────────────────
  if (activeZoneIds.length) {
    const weeks = groupDatesByWeek(schedulableDates);
    for (const week of weeks) {
      for (const rotation of weeklyRotations) {
        const teacher = teachersById[rotation.teacher_id];
        if (!teacher) continue; // pasif/silinmiş öğretmen — bu turu atla

        const zoneId = getZoneForCursor(activeZoneIds, rotation.zone_cursor);
        const zone = zonesById[zoneId];
        if (!zone) continue;

        for (const date of week.dates) {
          const zoneCounts = ensureZoneCounts(date);
          if ((zoneCounts[zone.id] || 0) >= zone.required_count) continue;

          const dailyCounts = ensureDailyCounts(date);
          const result = checkHardRules(
            {
              teacher,
              zone,
              unavailableWeekdays: unavailableByTeacher[teacher.id] || [],
              closures: closuresByZone[zone.id] || [],
              date,
              weekday: getWeekday(date),
              existingAssignmentCountForDate: dailyCounts[teacher.id] || 0,
            },
            { activeRuleKeys }
          );
          if (!result.eligible) continue;

          newAssignments.push({ teacherId: teacher.id, zoneId: zone.id, date });
          dutyCountByTeacher[teacher.id] = (dutyCountByTeacher[teacher.id] || 0) + 1;
          dailyCounts[teacher.id] = (dailyCounts[teacher.id] || 0) + 1;
          zoneCounts[zone.id] = (zoneCounts[zone.id] || 0) + 1;
        }

        // Hafta bitti — cursor'ı ilerlet (o hafta hiç atama
        // yapılamamış olsa bile; öğretmen o hafta hiçbir gün uygun
        // değilse bile döngü bir sonraki bölgeye geçer, tıkanmaz).
        const newCursor = (rotation.zone_cursor + 1) % activeZoneIds.length;
        const wrapped = newCursor === 0;
        rotation.zone_cursor = newCursor;
        rotation.cycle_count = wrapped ? rotation.cycle_count + 1 : rotation.cycle_count;
        await advanceRotation(supabase, rotation.id, {
          zoneCursor: rotation.zone_cursor,
          cycleCount: rotation.cycle_count,
          lastAdvanced: week.weekStart,
        });
      }
    }
  }

  // ── Faz B: basit adillik (kalan boş slotlar) ───────────────────
  for (const date of schedulableDates) {
    const weekday = getWeekday(date);
    const zoneCounts = ensureZoneCounts(date);
    const dailyCounts = ensureDailyCounts(date);

    for (const zone of zones) {
      const remainingSlots = Math.max(0, zone.required_count - (zoneCounts[zone.id] || 0));
      if (remainingSlots === 0) continue;

      const candidates = teachers
        .map((teacher) => ({
          teacher,
          result: checkHardRules(
            {
              teacher,
              zone,
              unavailableWeekdays: unavailableByTeacher[teacher.id] || [],
              closures: closuresByZone[zone.id] || [],
              date,
              weekday,
              existingAssignmentCountForDate: dailyCounts[teacher.id] || 0,
            },
            { activeRuleKeys }
          ),
        }))
        .filter((c) => c.result.eligible)
        .map((c) => ({ teacher: c.teacher, dutyCount: dutyCountByTeacher[c.teacher.id] || 0 }));

      const selected = selectFairest(candidates, remainingSlots);

      for (const s of selected) {
        newAssignments.push({ teacherId: s.teacher.id, zoneId: zone.id, date });
        dutyCountByTeacher[s.teacher.id] = (dutyCountByTeacher[s.teacher.id] || 0) + 1;
        dailyCounts[s.teacher.id] = (dailyCounts[s.teacher.id] || 0) + 1;
        zoneCounts[zone.id] = (zoneCounts[zone.id] || 0) + 1;
      }
    }
  }

  // 3) Tek toplu yazma.
  const created = await createAssignments(supabase, schoolId, newAssignments);
  return { createdCount: created.length };
}
