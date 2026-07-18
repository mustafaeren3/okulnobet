// Hard rule: bölge, verilen haftagününde çalışmıyorsa (duty_zones.active_days
// listesinde yoksa) atama yapılamaz. Saf fonksiyon.
// weekday: JS Date#getDay() ile aynı kural (0=Pazar ... 6=Cumartesi).

export function checkZoneActiveDay({ zone, weekday }) {
  const activeDays = zone.active_days || [];
  return activeDays.includes(weekday)
    ? { eligible: true, ruleKey: 'zone_active_day' }
    : { eligible: false, ruleKey: 'zone_active_day', reason: 'zone_closed_weekday' };
}
