// Hard rule runner: Faz 4'ün ilk turunda uygulanan 3 hard rule'u birlikte
// çalıştırır (öğretmen müsaitliği, bölge kapanışı, günlük maks. nöbet).
//
// NOT — henüz KAPSAM DIŞI (bilinçli, PHASE_REPORT.md'de işaretli):
// teacher.is_active / duty_zones.is_active, duty_zones.active_days,
// duty_zones.allowed_branches/blocked_branches. Bu fonksiyon "bir atama
// tamamen geçerli mi" sorusuna henüz tam cevap vermiyor, sadece onaylanan
// 3 kuralı kontrol ediyor.
//
// Saf fonksiyon: context'teki tüm veri (teacher, closures, mevcut atama
// sayısı vb.) DB'den önceden çekilip düz veri olarak verilir.

import { checkTeacherAvailability } from './teacherAvailability';
import { checkZoneClosure } from './zoneClosure';
import { checkMaxDutyPerDay } from './maxDutyPerDay';

export function checkHardRules(context) {
  const results = [
    checkTeacherAvailability(context),
    checkZoneClosure(context),
    checkMaxDutyPerDay(context),
  ];
  const violations = results.filter((r) => !r.eligible);
  return { eligible: violations.length === 0, violations };
}
