// İl/ilçe listesi — MEB okul verisinden (mebSchools.json) türetildi, bu
// yüzden buradaki ilçeler her zaman okul listesiyle birebir eşleşir.
// Küçük veri (81 il, ~989 ilçe), client bileşeninde doğrudan kullanılabilir.
// Signup'ın ANA akışı artık bunu kullanmıyor (bkz. SchoolSearchField.jsx +
// lib/data/schoolSearch.js — tek akıllı arama kutusu) — bu modül SADECE
// "okulum listede yok, elle gireceğim" geri düşüşü için hâlâ gerekli
// (il/ilçe'yi serbest metin YAPMAMAK için, aksi halde düzelttiğimiz
// duplicate/yazım kalitesi manuel girişten geri sızardı).
import provincesData from './mebProvinces.json';

export const MEB_PROVINCES = Object.keys(provincesData).sort((a, b) => a.localeCompare(b, 'tr'));

export function getDistrictsForProvince(province) {
  return provincesData[province] || [];
}
