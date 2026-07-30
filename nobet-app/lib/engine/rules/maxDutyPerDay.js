// Hard rule: bir öğretmen aynı GÜNDE en fazla 1 nöbet tutar — istisnasız
// (aynı anda iki bölgede olamaz). "Çift nöbet" (allow_double_duty) GÜN
// değil HAFTA bazlıdır — bkz. maxDutyPerWeek.js. (Önceden bu kural çift
// nöbetlilere aynı günde 2 bölge veriyordu; kullanıcı geri bildirimiyle
// düzeltildi: çift nöbet = aynı hafta içinde ikinci bir nöbet günü.)
// Saf fonksiyon: mevcut atama sayısını kendisi sorgulamaz, çağıran taraf
// (lib/db üzerinden) hesaplayıp parametre olarak verir.

export function checkMaxDutyPerDay({ existingAssignmentCountForDate }) {
  return existingAssignmentCountForDate >= 1
    ? { eligible: false, ruleKey: 'max_duty_per_day', reason: 'max_duty_per_day_reached' }
    : { eligible: true, ruleKey: 'max_duty_per_day' };
}
