// Hard rule: öğretmenin branşı, bölgenin allowed_branches/blocked_branches
// listeleriyle eşleşmiyorsa atama yapılamaz. Saf fonksiyon.
//
// allowed_branches boş/null → kısıt yok, herkes uygun.
// blocked_branches boş/null → kısıt yok.
// Karşılaştırma normalizeTr ile yapılır (Türkçe büyük/küçük harf
// eşleşmesi için — bkz. lib/text.js).

import { normalizeTr } from '@/lib/text';

export function checkBranchMatch({ teacher, zone }) {
  const branch = normalizeTr(teacher.branch);

  if (zone.blocked_branches && zone.blocked_branches.some((b) => normalizeTr(b) === branch)) {
    return { eligible: false, ruleKey: 'branch_match', reason: 'branch_blocked' };
  }

  if (zone.allowed_branches && zone.allowed_branches.length > 0) {
    const isAllowed = zone.allowed_branches.some((b) => normalizeTr(b) === branch);
    if (!isAllowed) {
      return { eligible: false, ruleKey: 'branch_match', reason: 'branch_not_allowed' };
    }
  }

  return { eligible: true, ruleKey: 'branch_match' };
}
