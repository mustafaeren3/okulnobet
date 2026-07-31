// Program başarı ekranındaki "adalet puanı" ve "tahmini zaman tasarrufu"
// metriklerini hesaplayan saf fonksiyonlar. DB/Next.js/fetch bilmez.

// dutyCountsByTeacherId: { [teacherId]: nöbetSayısı }. Öğretmenler
// arasındaki nöbet dağılımı ne kadar eşitse skor o kadar yüksek (100 =
// herkes tam eşit, varyasyon arttıkça düşer). stddev/mean oranı (değişim
// katsayısı) yüzdeye çevrilip 100'den düşülür — birim bağımsız, öğretmen
// sayısından etkilenmez.
export function computeFairnessScore(dutyCountsByTeacherId) {
  const counts = Object.values(dutyCountsByTeacherId || {});
  if (!counts.length) return 100;

  const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
  if (mean === 0) return 100;

  const variance = counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length;
  const stddev = Math.sqrt(variance);
  const score = 100 - Math.round((stddev / mean) * 100);
  return Math.max(0, Math.min(100, score));
}

// İdarecinin elle yapacağı nöbet planlamasına kıyasla kazanılan süre —
// kaba bir tahmin: her nöbet ataması için ortalama 3 dakika (kimin uygun
// olduğunu kontrol etme, kuralları hatırlama, çizelgeye elle işleme).
// Kesin bir ölçüm değil, ürün pazarlaması için gösterge niteliğinde.
const MINUTES_PER_MANUAL_ASSIGNMENT = 3;

export function estimateMinutesSaved(totalDutyCount) {
  const count = Number.isFinite(totalDutyCount) && totalDutyCount > 0 ? totalDutyCount : 0;
  return count * MINUTES_PER_MANUAL_ASSIGNMENT;
}
