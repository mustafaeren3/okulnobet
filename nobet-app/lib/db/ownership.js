// Paylaşılan "bu kayıt gerçekten bu okula mı ait" doğrulaması. Kalite
// denetimi bulgusu: manuel atama action'ları (öğretmen/bölge/görevli
// müdür yardımcısı seçimi) client'tan gelen bir id'yi RLS'in dolaylı
// korumasına güvenerek insert ediyordu — RLS atamanın KENDİ school_id'sini
// korur ama seçilen id'nin (teacherId/zoneId/personId) AYNI okula ait
// olduğunu doğrulamaz (FK bunu kontrol etmez, sadece satırın VAR olduğunu
// kontrol eder). Normal UI akışında imkansız (seçenekler zaten
// requireSchoolId'den gelen listeden) ama doğrudan action çağrısıyla
// başka bir okulun id'si gönderilebilir — bu yüzden burada, insert'ten
// ÖNCE, açık bir kontrol var. 3. somut kullanım (teacher/zone/assistant
// principal) ile tek bir paylaşılan fonksiyon haklı (CLAUDE.md sadelik
// kuralı: ikinci kullanımda soyutlama).
export async function assertBelongsToSchool(supabase, table, id, schoolId, label) {
  if (!id) return; // null/opsiyonel referans (ör. teacherId her zaman zorunlu değilse) — çağıran zaten kendi zorunluluğunu kontrol eder
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`${label} bu okula ait değil.`);
}
