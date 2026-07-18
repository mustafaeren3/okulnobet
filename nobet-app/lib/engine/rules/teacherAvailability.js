// Hard rule: öğretmenin restriction_mode + teacher_unavailable_days'e göre
// bir haftagününde müsait olup olmadığını belirler.
// (bkz. supabase/migrations/0004_teachers_and_zones.sql — restriction_mode
// yorumu.) Saf fonksiyon: DB/Next.js/fetch bilmez.
//
// weekday: JS Date#getDay() ile aynı kural (0=Pazar ... 6=Cumartesi).

export function checkTeacherAvailability({ teacher, unavailableWeekdays, weekday }) {
  const mode = teacher.restriction_mode;
  const isListed = unavailableWeekdays.includes(weekday);

  if (mode === 'EXCEPT') {
    return isListed
      ? { eligible: false, ruleKey: 'teacher_availability', reason: 'teacher_unavailable_weekday' }
      : { eligible: true, ruleKey: 'teacher_availability' };
  }

  if (mode === 'ONLY') {
    return isListed
      ? { eligible: true, ruleKey: 'teacher_availability' }
      : { eligible: false, ruleKey: 'teacher_availability', reason: 'teacher_not_scheduled_weekday' };
  }

  // 'ALL' (veya tanınmayan bir değer) → kısıt yok.
  return { eligible: true, ruleKey: 'teacher_availability' };
}
