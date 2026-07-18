// Belirli bir öğretmen+bölge+tarih ataması için gerçek veriyi toplayıp
// lib/engine/rules'taki saf checkHardRules fonksiyonuna aktarır. DB'ye
// dokunan tek katman burası (CLAUDE.md mimari kural 2); checkHardRules'ın
// kendisi hâlâ saf kalır (kural 1) — bu dosya sadece "veriyi çek, saf
// fonksiyona ver" işini yapar.

import { getTeacherById } from './teachers';
import { getDutyZoneById } from './dutyZones';
import { getUnavailableWeekdays } from './teacherAvailability';
import { getZoneClosures } from './zoneClosures';
import { getAssignmentCountForTeacherDate } from './dutyAssignments';
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
