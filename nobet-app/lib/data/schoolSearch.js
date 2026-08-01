// Okul akıllı arama — MEB'in ~55 bin kayıtlık okul verisi (mebSchools.json,
// ~3MB) üzerinde çalışır. Bu dosya SADECE 'use server' action'ları
// içinden import edilmeli — client bileşenine asla import edilmemeli,
// aksi halde tüm veri client bundle'ına dahil olur (bkz. eski
// mebSchoolLookup.js'in de uyduğu kural — bu dosya onun yerini alıyor,
// artık il/ilçe/okul kademeli seçim yok, tek arama kutusu var).
import schoolsData from './mebSchools.json';
import { foldTurkish } from '@/lib/text';

export const OKUL_DIGER_VALUE = '__DIGER__';
export const OKUL_OZEL_VALUE = '__OZEL__';

// İndeks bir kez kurulup modül kapsamında (warm serverless instance
// boyunca) önbelleğe alınır — her arama isteğinde 55 bin kaydı yeniden
// foldTurkish()'lemek gereksiz iş olurdu (memoization).
let indexCache = null;

function buildIndex() {
  const rows = [];
  for (const [province, districts] of Object.entries(schoolsData)) {
    for (const [district, schools] of Object.entries(districts)) {
      for (const s of schools) {
        const foldedName = foldTurkish(s.name);
        const words = foldTurkish(`${province} ${district} ${s.name}`).split(' ').filter(Boolean);
        rows.push({ name: s.name, district, province, type: s.type, foldedName, words });
      }
    }
  }
  return rows;
}

function getIndex() {
  if (!indexCache) indexCache = buildIndex();
  return indexCache;
}

// Sınırlı (bounded) Levenshtein — maxDist aşılırsa null döner, tam
// mesafeyi hesaplamadan erken çıkar. Uzunluk farkı maxDist'i aşan
// kelime çiftleri DP'ye hiç girmeden elenir (55 bin kayıtta fuzzy
// katmanının pratikte hızlı kalmasını sağlayan asıl kısayol).
function levenshteinBounded(a, b, maxDist) {
  if (Math.abs(a.length - b.length) > maxDist) return null;
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDist) return null;
    [prev, curr] = [curr, prev];
  }
  return prev[n] <= maxDist ? prev[n] : null;
}

// Kısa kelimede 1 harflik, orta uzunlukta 2, uzun kelimede 3 harflik
// yazım hatasına izin verir — sabit bir eşik kısa kelimelerde ("iki
// harften biri yanlışsa her şeyle eşleşir" gibi) anlamsız sonuç
// üretirdi.
function fuzzyThreshold(len) {
  if (len <= 4) return 1;
  if (len <= 8) return 2;
  return 3;
}

function fuzzyMatchesAllTokens(tokens, words) {
  return tokens.every((t) => words.some((w) => levenshteinBounded(t, w, fuzzyThreshold(t.length)) !== null));
}

// Öncelik sırası (kullanıcı isteğiyle sabit): 1) tam eşleşme
// 2) başlangıç eşleşmesi 3) kelime eşleşmesi (çok-token: "izmir bornova"
// gibi il+ilçe birleşimleri de bunun sayesinde çalışır) 4) fuzzy (yazım
// hatası toleransı) 5) içeren (fallback). Her okul için SADECE en iyi
// (en düşük numaralı) katman hesaplanır, hiçbir eşleşme yoksa sonuç
// listesine hiç girmez.
export function searchSchools(query, { limit = 200 } = {}) {
  const q = foldTurkish(query || '');
  if (!q) return [];
  const tokens = q.split(' ').filter(Boolean);
  const index = getIndex();
  const scored = [];

  for (const row of index) {
    let tier = null;

    if (row.foldedName === q) {
      tier = 1;
    } else if (row.foldedName.startsWith(q)) {
      tier = 2;
    } else if (tokens.every((t) => row.words.some((w) => w === t || w.startsWith(t)))) {
      tier = 3;
    } else if (fuzzyMatchesAllTokens(tokens, row.words)) {
      tier = 4;
    } else if (row.words.some((w) => w.includes(q)) || tokens.every((t) => row.words.some((w) => w.includes(t)))) {
      tier = 5;
    }

    if (tier !== null) scored.push({ row, tier });
  }

  scored.sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.row.name.localeCompare(b.row.name, 'tr')));

  return scored.slice(0, limit).map(({ row }) => ({
    name: row.name,
    district: row.district,
    province: row.province,
    type: row.type,
  }));
}
