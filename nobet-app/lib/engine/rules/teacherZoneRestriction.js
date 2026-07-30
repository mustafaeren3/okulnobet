// Hard rule: öğretmenin fixed_zone_id'si varsa SADECE o bölgede uygun
// sayılır (bkz. supabase/migrations/0015_teacher_fixed_zone.sql). Saf
// fonksiyon: DB/Next.js/fetch bilmez.
//
// fixed_zone_id boş/null → kısıt yok, her bölgede uygun.

export function checkTeacherZoneRestriction({ teacher, zone }) {
  if (teacher.fixed_zone_id && teacher.fixed_zone_id !== zone.id) {
    return { eligible: false, ruleKey: 'teacher_zone_restriction', reason: 'teacher_fixed_to_other_zone' };
  }
  return { eligible: true, ruleKey: 'teacher_zone_restriction' };
}
