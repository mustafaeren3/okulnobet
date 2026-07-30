// Hard rule: bir öğretmen aynı HAFTA içinde en fazla kaç nöbet tutabilir.
// allow_double_duty=false → 1 (haftada tek nöbet günü),
// allow_double_duty=true → 2 ("Gerekirse çift nöbet tutabilir (x2)" —
// aynı hafta içinde ikinci bir nöbet günü alabilir).
//
// Kullanıcının açık tarifiyle KESİN bir kural (istisnasız): "17 öğretmen
// var, 20 farklı nöbet yeri var, 3 kişinin çift nöbet tutması gerekiyor;
// çift nöbet tutabilir diye işaretlemezsem o 3 yeri boş bırak." Yani
// haftalık hakkı dolan bir öğretmen, öğretmen sayısı ne kadar kıt olursa
// olsun, o hafta başka hiçbir hücreye aday OLAMAZ — hücre idareci elle
// dolduruna ya da öğretmen çift nöbete işaretlenene kadar boş kalır.
//
// (Kök neden geçmişi: boş hücre doldurma TOPLAM nöbet sayısına bakıp en
// az tutmuş öğretmeni seçiyordu, aynı öğretmenin AYNI HAFTA içinde başka
// bir güne zaten atanmış olup olmadığına bakmıyordu — bu kural tam
// olarak bunu engeller.)
// Saf fonksiyon: haftalık mevcut atama sayısını çağıran taraf hesaplar.

export function checkMaxDutyPerWeek({ teacher, existingAssignmentCountForWeek }) {
  const max = teacher.allow_double_duty ? 2 : 1;
  return (existingAssignmentCountForWeek ?? 0) >= max
    ? { eligible: false, ruleKey: 'max_duty_per_week', reason: 'max_duty_per_week_reached' }
    : { eligible: true, ruleKey: 'max_duty_per_week' };
}
