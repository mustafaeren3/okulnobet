// Hard rule: bir öğretmen aynı günde en fazla kaç nöbet tutabilir.
// allow_double_duty=false → 1, true → 2 (çift nöbet, farklı bölge —
// bkz. supabase/migrations/0009_duty_assignments.sql unique kısıtı).
// Saf fonksiyon: mevcut atama sayısını kendisi sorgulamaz, çağıran taraf
// (lib/db üzerinden) hesaplayıp parametre olarak verir.

export function checkMaxDutyPerDay({ teacher, existingAssignmentCountForDate }) {
  const max = teacher.allow_double_duty ? 2 : 1;
  return existingAssignmentCountForDate >= max
    ? { eligible: false, ruleKey: 'max_duty_per_day', reason: 'max_duty_per_day_reached' }
    : { eligible: true, ruleKey: 'max_duty_per_day' };
}
