// Türkçe metin karşılaştırma yardımcısı. JS'in regex /i bayrağı ve
// String#toLowerCase() Türkçe'ye özgü ı/İ eşleşmesini bilmiyor
// ("SINIF" ↔ "sınıf" gibi çiftler onlarla eşleşmiyor) — bu yüzden
// büyük/küçük harf duyarsız Türkçe karşılaştırma her zaman bu
// fonksiyon üzerinden yapılmalı, /i bayrağına veya toLowerCase()'e
// güvenilmemeli. Saf fonksiyon: lib/engine/ ve app/ katmanlarının
// ikisi de kullanabilir.

export function normalizeTr(s) {
  return (s || '').toLocaleLowerCase('tr-TR').trim();
}

// normalizeTr()'den FARKLI bir amaç için: o "Türkçe harfleri KORUYARAK
// büyük/küçük harf duyarsız karşılaştır" (ör. öğretmen adı eşleştirme,
// ş ile s'yi kasıtlı olarak ayrı tutmalı). Bu fonksiyon ise arama kutusu
// gibi "kullanıcı ç/ş/ı yerine c/s/i yazsa da aynı sonucu bulsun" isteyen
// yerler için — Türkçe'ye özgü harfleri ASCII karşılığına katlıyor
// (ç→c, ğ→g, ı/İ→i, ö→o, ş→s, ü→u), sonra kalan olası aksanları (NFD +
// birleşik işaretleri atma) da temizliyor. Tek merkezi yer — arama
// yapan her kod bunu kullanmalı, kendi ad-hoc regex'ini yazmamalı.
const TURKISH_FOLD_MAP = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

export function foldTurkish(s) {
  return (s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (ch) => TURKISH_FOLD_MAP[ch] || ch)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}
