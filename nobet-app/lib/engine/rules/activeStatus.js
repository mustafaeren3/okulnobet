// Hard rule: pasif (is_active=false) öğretmen veya bölgeye atama yapılamaz.
// Saf fonksiyon.

export function checkActiveStatus({ teacher, zone }) {
  if (teacher.is_active === false) {
    return { eligible: false, ruleKey: 'active_status', reason: 'teacher_inactive' };
  }
  if (zone.is_active === false) {
    return { eligible: false, ruleKey: 'active_status', reason: 'zone_inactive' };
  }
  return { eligible: true, ruleKey: 'active_status' };
}
