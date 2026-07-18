// Hard rule runner: bir öğretmen+bölge+tarih atamasının geçerli olup
// olmadığını belirleyen tüm hard rule'ları birlikte çalıştırır.
//
// NOT — henüz KAPSAM DIŞI (bilinçli, PHASE_REPORT.md'de işaretli):
// `rules` tablosundan okunan dinamik/okul-bazlı kurallar (bu 6 kural
// şu an her okulda sabit/her zaman açık) ve soft rule'lar.
//
// Saf fonksiyon: context'teki tüm veri (teacher, zone, closures, mevcut
// atama sayısı vb.) DB'den önceden çekilip düz veri olarak verilir.

import { checkTeacherAvailability } from './teacherAvailability';
import { checkZoneClosure } from './zoneClosure';
import { checkMaxDutyPerDay } from './maxDutyPerDay';
import { checkActiveStatus } from './activeStatus';
import { checkZoneActiveDay } from './zoneActiveDay';
import { checkBranchMatch } from './branchMatch';

export function checkHardRules(context) {
  const results = [
    checkActiveStatus(context),
    checkZoneActiveDay(context),
    checkBranchMatch(context),
    checkTeacherAvailability(context),
    checkZoneClosure(context),
    checkMaxDutyPerDay(context),
  ];
  const violations = results.filter((r) => !r.eligible);
  return { eligible: violations.length === 0, violations };
}
