// Hard rule runner: bir öğretmen+bölge+tarih atamasının geçerli olup
// olmadığını belirleyen tüm hard rule'ları birlikte çalıştırır.
//
// NOT — henüz KAPSAM DIŞI (bilinçli, PHASE_REPORT.md'de işaretli): soft
// rule'lar.
//
// Saf fonksiyon: context'teki tüm veri (teacher, zone, closures, mevcut
// atama sayısı vb.) DB'den önceden çekilip düz veri olarak verilir.
// options.activeRuleKeys: hangi kuralların bu okulda etkin olduğunu
// belirten bir Set<string> (rule_key). Belirtilmezse hepsi etkin sayılır
// (geriye dönük uyumluluk — rules tablosunda hiç satırı olmayan okullar
// için mevcut "hep açık" davranış korunur). DB'den okuma ve varsayılan
// belirleme işi lib/db/rules.js'in (getActiveHardRuleKeys) sorumluluğu —
// bu dosya sadece verilen Set'i uygular, sorgu atmaz.

import { checkTeacherAvailability } from './teacherAvailability';
import { checkZoneClosure } from './zoneClosure';
import { checkMaxDutyPerDay } from './maxDutyPerDay';
import { checkActiveStatus } from './activeStatus';
import { checkZoneActiveDay } from './zoneActiveDay';
import { checkBranchMatch } from './branchMatch';

export function checkHardRules(context, options = {}) {
  const { activeRuleKeys } = options;
  const results = [
    checkActiveStatus(context),
    checkZoneActiveDay(context),
    checkBranchMatch(context),
    checkTeacherAvailability(context),
    checkZoneClosure(context),
    checkMaxDutyPerDay(context),
  ].filter((r) => !activeRuleKeys || activeRuleKeys.has(r.ruleKey));

  const violations = results.filter((r) => !r.eligible);
  return { eligible: violations.length === 0, violations };
}
