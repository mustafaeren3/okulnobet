// Belirli bir öğretmen+bölge+tarih ataması için gerçek veriyi toplayıp
// lib/engine/rules'taki saf checkHardRules fonksiyonuna aktarır. DB'ye
// dokunan tek katman burası (CLAUDE.md mimari kural 2); checkHardRules'ın
// kendisi hâlâ saf kalır (kural 1) — bu dosya sadece "veriyi çek, saf
// fonksiyona ver" işini yapar.

import { getTeacherById, getTeachers } from './teachers';
import { getDutyZoneById } from './dutyZones';
import { getUnavailableWeekdays, getUnavailableWeekdaysForTeachers } from './teacherAvailability';
import { getZoneClosures } from './zoneClosures';
import {
  getAssignmentCountForTeacherDate,
  getAssignmentCountsForDate,
  getAssignmentCountsForWeek,
  getTotalAssignmentCounts,
} from './dutyAssignments';
import { getActiveHardRuleKeys } from './rules';
import { checkHardRules } from '@/lib/engine/rules';
import { getWeekday } from '@/lib/engine/weekday';
import { selectFairest } from '@/lib/engine/selectFairest';

export async function checkAssignmentEligibility(supabase, { schoolId, teacherId, zoneId, date }) {
  const [teacher, zone, unavailableWeekdays, closures, existingAssignmentCountForDate, weekCounts, activeRuleKeys] = await Promise.all([
    getTeacherById(supabase, teacherId),
    getDutyZoneById(supabase, zoneId),
    getUnavailableWeekdays(supabase, teacherId),
    getZoneClosures(supabase, zoneId),
    getAssignmentCountForTeacherDate(supabase, teacherId, date),
    getAssignmentCountsForWeek(supabase, schoolId, date),
    getActiveHardRuleKeys(supabase, schoolId),
  ]);

  return checkHardRules(
    {
      teacher,
      zone,
      unavailableWeekdays,
      closures,
      date,
      weekday: getWeekday(date),
      existingAssignmentCountForDate,
      existingAssignmentCountForWeek: weekCounts[teacherId] || 0,
    },
    { activeRuleKeys }
  );
}

// Bir bölge+tarih için okuldaki TÜM öğretmenleri tarar, her biri için
// hard rule sonucunu döndürür (henüz seçim/atama yapmaz — Scheduling
// Engine'in "kimi seçeceğiz" kısmı ayrı bir adım). Öğretmen başına ayrı
// sorgu atmak yerine 4 toplu sorgu kullanır.
export async function getEligibleTeachersForZone(supabase, { schoolId, zoneId, date }) {
  const [zone, teachers, closures, activeRuleKeys] = await Promise.all([
    getDutyZoneById(supabase, zoneId),
    getTeachers(supabase, schoolId),
    getZoneClosures(supabase, zoneId),
    getActiveHardRuleKeys(supabase, schoolId),
  ]);

  const teacherIds = teachers.map((t) => t.id);
  const [unavailableByTeacher, assignmentCountsByTeacher, weekCounts] = await Promise.all([
    getUnavailableWeekdaysForTeachers(supabase, teacherIds),
    getAssignmentCountsForDate(supabase, schoolId, date),
    getAssignmentCountsForWeek(supabase, schoolId, date),
  ]);

  const weekday = getWeekday(date);

  return teachers.map((teacher) => {
    const result = checkHardRules(
      {
        teacher,
        zone,
        unavailableWeekdays: unavailableByTeacher[teacher.id] || [],
        closures,
        date,
        weekday,
        existingAssignmentCountForDate: assignmentCountsByTeacher[teacher.id] || 0,
        existingAssignmentCountForWeek: weekCounts[teacher.id] || 0,
      },
      { activeRuleKeys }
    );
    return { teacher, ...result };
  });
}

// Bir bölge+tarih için uygun adaylar arasından zone.required_count kadar
// öğretmen seçer. Seçim ölçütü: basit adillik — o ana kadar toplamda en
// az nöbet tutmuş olan(lar). Haftalık sıralı yer değişimi (rotasyon)
// toplu üretimin işi (lib/db/bulkSchedule.js), bu tekil uç sadece
// adillikle seçer.
export async function selectTeachersForZone(supabase, { schoolId, zoneId, date }) {
  const [zone, results, totalCounts] = await Promise.all([
    getDutyZoneById(supabase, zoneId),
    getEligibleTeachersForZone(supabase, { schoolId, zoneId, date }),
    getTotalAssignmentCounts(supabase, schoolId),
  ]);

  const candidates = results
    .filter((r) => r.eligible)
    .map((r) => ({ teacher: r.teacher, dutyCount: totalCounts[r.teacher.id] || 0 }));

  return selectFairest(candidates, zone.required_count);
}
