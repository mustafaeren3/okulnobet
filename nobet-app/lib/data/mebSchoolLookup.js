// Okul adı arama — MEB'in canlı okul servisinden derlenmiş ~55 bin kayıt
// (mebSchools.json, ~3MB). Bu dosya SADECE 'use server' action'ları
// içinden import edilmeli — client bileşenine asla import edilmemeli,
// aksi halde tüm veri client bundle'ına dahil olur.
import schoolsData from './mebSchools.json';

export const OKUL_DIGER_VALUE = '__DIGER__';
export const OKUL_OZEL_VALUE = '__OZEL__';

// `type` (ham anahtar, ör. 'ilkokul') bilerek dönüyor — kullanıcıya artık
// gösterilmiyor (isim zaten "... İlkokulu" içeriyor), ama actions.js
// register_school'a gönderilecek okul türünü kullanıcıya SORMADAN buradan
// çıkarabilsin diye taşınıyor (bkz. inferSchoolType).
export function getSchoolsForDistrict(province, district) {
  const list = schoolsData[province]?.[district] || [];
  return list.map((s) => ({ name: s.name, type: s.type }));
}
