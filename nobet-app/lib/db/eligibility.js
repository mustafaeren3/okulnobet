// Belirli bir öğretmen+bölge+tarih ataması için gerçek veriyi toplayıp
// lib/engine/rules'taki saf checkHardRules fonksiyonuna aktarır. DB'ye
// dokunan tek katman burası (CLAUDE.md mimari kural 2); checkHardRules'ın
// kendisi hâlâ saf kalır (kural 1) — bu dosya sadece "veriyi çek, saf
// fonksiyona ver" işini yapar.

import { getTeacherById, getTeachers } from './teachers';
import { getDutyZoneById } from './dutyZones';
import { getUnavailableWeekdays, getUnavailableWeekdaysForTeachers } from './teacherAvailability';
import { getZoneClosures } from './zoneClosures';
import { getAssignmentCountForTeacherDate, getAssignmentCountsForDate } from './dutyAssignments';
import { checkHardRules } from '@/lib/engine/rules';
import { getWeekday } from '@/lib/engine/weekday';

export async function checkAssignmentEligibility(supabase, { teacherId, zoneId, date }) {
  const [teacher, zone, unavailableWeekdays, closures, existingAssignmentCountForDate] = await Promise.all([
    getTeacherById(supabase, teacherId),
    getDutyZoneById(supabase, zoneId),
    getUnavailableWeekdays(supabase, teacherId),
    getZoneClosures(supabase, zoneId),
    getAssignmentCountForTeacherDate(supabase, teacherId, date),
  ]);

  return checkHardRules({
    teacher,
    zone,
    unavailableWeekdays,
    closures,
    date,
    weekday: getWeekday(date),
    existingAssignmentCountForDate,
  });
}

// Bir bölge+tarih için okuldaki TÜM öğretmenleri tarar, her biri için
// hard rule sonucunu döndürür (henüz seçim/atama yapmaz — Scheduling
// Engine'in "kimi seçeceğiz" kısmı ayrı bir adım). Öğretmen başına ayrı
// sorgu atmak yerine 4 toplu sorgu kullanır.
export async function getEligibleTeachersForZone(supabase, { schoolId, zoneId, date }) {
  const [zone, teachers, closures] = await Promise.all([
    getDutyZoneById(supabase, zoneId),
    getTeachers(supabase, schoolId),
    getZoneClosures(supabase, zoneId),
  ]);

  const teacherIds = teachers.map((t) => t.id);
  const [unavailableByTeacher, assignmentCountsByTeacher] = await Promise.all([
    getUnavailableWeekdaysForTeachers(supabase, teacherIds),
    getAssignmentCountsForDate(supabase, schoolId, date),
  ]);

  const weekday = getWeekday(date);

  return teachers.map((teacher) => {
    const result = checkHardRules({
      teacher,
      zone,
      unavailableWeekdays: unavailableByTeacher[teacher.id] || [],
      closures,
      date,
      weekday,
      existingAssignmentCountForDate: assignmentCountsByTeacher[teacher.id] || 0,
    });
    return { teacher, ...result };
  });
}
