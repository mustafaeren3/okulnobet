// İl/ilçe listesi — MEB okul verisinden (mebSchools.json) türetildi, bu
// yüzden buradaki ilçeler her zaman okul listesiyle birebir eşleşir.
// Küçük veri (81 il, ~1000 ilçe), client bileşeninde doğrudan kullanılabilir.
// Okul listesi (büyük veri) için bkz. mebSchoolLookup.js — o dosya SADECE
// server action içinden import edilmeli.
import provincesData from './mebProvinces.json';

export const MEB_PROVINCES = Object.keys(provincesData).sort((a, b) => a.localeCompare(b, 'tr'));

export function getDistrictsForProvince(province) {
  return provincesData[province] || [];
}
