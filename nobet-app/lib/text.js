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
