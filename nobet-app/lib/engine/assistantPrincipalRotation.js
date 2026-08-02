// "Görevli Müdür Yardımcısı" modülünün saf dönüşüm (rotasyon) motoru.
// DB/Next.js/fetch bilmez (CLAUDE.md kural 1).
//
// Neden lib/engine/rotation.js'e eklenmedi de ayrı bir dosya açıldı:
// rotation.js'teki rotasyon, HAFTALIK BİR IZGARAYI (gün × bölge hücreleri)
// ilerletiyor — bu modülün ihtiyacı ise gün başına TEK bir kişiyi düz bir
// listede ilerletmek (grid yok, bölge yok). rotation.js'i bu daha basit
// kullanım için bükmek onu daha soyut/karmaşık hale getirirdi. CLAUDE.md'nin
// "motor çekirdeğine dokunulmaz, yeni kural/kapasite = yeni dosya" ilkesi
// burada da uygulandı: öğretmen motoruna hiç dokunulmadı, bu modül baştan
// sona kendi paralel dosyalarında yaşıyor (bkz. lib/db/assistantPrincipal*.js).
//
// Üç fonksiyon da `dates` parametresini HAZIR ALIR — tatil/hafta sonu/aktif
// gün filtrelemesi burada TEKRAR YAZILMAZ. Çağıran taraf (lib/db/
// assistantPrincipalSchedule.js), tıpkı bulkSchedule.js'in öğretmen motoru
// için yaptığı gibi, `lib/engine/scheduler.js`'teki `isSchedulableDay` ile
// önceden filtrelenmiş bir tarih listesi verir. Böylece rotasyon sırası
// tatilde İLERLEMEZ — çünkü tatil günü zaten `dates` içinde hiç yer almaz.

import { getWeekStart } from './rotation.js';

// Her tarihe listede bir sonraki kişiyi sırayla atar (Ali, Ayşe, Ali, ...).
// resumeIndex: dates[0]'a atanacak kişinin personIds içindeki başlangıç
// indeksi (bir önceki üretim turundan devam etmek için).
export function buildSequentialAssignments(personIds, dates, { resumeIndex = 0 } = {}) {
  if (!personIds.length) return [];
  const n = personIds.length;
  return dates.map((date, i) => ({
    personId: personIds[(resumeIndex + i) % n],
    date,
  }));
}

// Bir hafta (Pazartesi başlangıçlı) boyunca aynı kişi görevli olur, sonraki
// haftada listede bir sonraki kişiye geçilir. `dates` içinde bulunmayan
// haftalar (tamamı tatil olan haftalar) rotasyonda hiç yer kaplamaz —
// yalnızca `dates`'te GERÇEKTEN görünen haftalar sayılır.
// resumeIndex: dates içindeki İLK haftaya atanacak kişinin başlangıç indeksi.
export function buildWeeklyBlockAssignments(personIds, dates, { resumeIndex = 0 } = {}) {
  if (!personIds.length) return [];
  const n = personIds.length;
  const weekOrder = [];
  const weekIndexOf = new Map();
  for (const date of dates) {
    const weekStart = getWeekStart(date);
    if (!weekIndexOf.has(weekStart)) {
      weekIndexOf.set(weekStart, weekOrder.length);
      weekOrder.push(weekStart);
    }
  }
  return dates.map((date) => {
    const weekOffset = weekIndexOf.get(getWeekStart(date));
    return { personId: personIds[(resumeIndex + weekOffset) % n], date };
  });
}

// Her kişi ardışık `blockSizeDays` ADET AKTİF (dates içindeki) günü
// kapsar, sonra sıradaki kişiye geçilir. blockSizeDays < 1 ise 1 kabul
// edilir (sıfıra bölme/sonsuz döngü riskine karşı savunma).
// resumeIndex: mevcut bloktaki kişinin başlangıç indeksi.
// resumeDayCount: o kişinin bu bloktan önce zaten kaç gün doldurduğu
// (bir önceki üretim turundan devam ederken bloğun ortasından başlamak için).
export function buildNDayBlockAssignments(personIds, dates, blockSizeDays, { resumeIndex = 0, resumeDayCount = 0 } = {}) {
  if (!personIds.length) return [];
  const n = personIds.length;
  const blockSize = Math.max(1, Math.floor(blockSizeDays) || 1);
  return dates.map((date, i) => {
    const totalDayCount = resumeDayCount + i;
    const blockOffset = Math.floor(totalDayCount / blockSize);
    return { personId: personIds[(resumeIndex + blockOffset) % n], date };
  });
}

export const ASSISTANT_PRINCIPAL_ROTATION_MODES = ['sequential_daily', 'weekly_block', 'n_day_block'];

// n_day_block'ın üst sınırı — supabase/migrations/0043'teki DB CHECK
// constraint'iyle AYNI değer (kalite denetimi bulgusu: önceden üst sınır
// yoktu). Burada tek yerde tanımlı, action katmanı bunu import eder —
// DB'deki gerçek sınırla (asıl uygulanan yer) sayı iki ayrı dosyada
// tekrarlanıp birbirinden sapmasın diye.
export const AP_MAX_BLOCK_SIZE_DAYS = 90;

// Tek giriş noktası — mode'a göre doğru üreticiye yönlendirir.
// resume: {index, dayCount} — mode'a göre ilgili alan(lar) kullanılır.
export function computeAssistantPrincipalAssignments({ personIds, dates, mode, blockSizeDays, resume }) {
  const resumeIndex = resume?.index ?? 0;
  const resumeDayCount = resume?.dayCount ?? 0;
  switch (mode) {
    case 'sequential_daily':
      return buildSequentialAssignments(personIds, dates, { resumeIndex });
    case 'weekly_block':
      return buildWeeklyBlockAssignments(personIds, dates, { resumeIndex });
    case 'n_day_block':
      return buildNDayBlockAssignments(personIds, dates, blockSizeDays, { resumeIndex, resumeDayCount });
    default:
      throw new Error(`Bilinmeyen rotasyon modu: ${mode}`);
  }
}
