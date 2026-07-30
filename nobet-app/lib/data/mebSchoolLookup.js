// Okul adı arama — MEB'in canlı okul servisinden derlenmiş ~55 bin kayıt
// (mebSchools.json, ~3MB). Bu dosya SADECE 'use server' action'ları
// içinden import edilmeli — client bileşenine asla import edilmemeli,
// aksi halde tüm veri client bundle'ına dahil olur.
import schoolsData from './mebSchools.json';

export const SCHOOL_TYPE_LABELS = {
  ilkokul: 'İlkokul',
  ortaokul: 'Ortaokul',
  imam_hatip_ortaokulu: 'İmam Hatip Ortaokulu',
  lise: 'Lise',
  anadolu_lisesi: 'Anadolu Lisesi',
  fen_lisesi: 'Fen Lisesi',
  sosyal_bilimler_lisesi: 'Sosyal Bilimler Lisesi',
  imam_hatip_lisesi: 'İmam Hatip Lisesi',
  mesleki_teknik_lise: 'Mesleki ve Teknik Lise',
  guzel_sanatlar_lisesi: 'Güzel Sanatlar Lisesi',
  spor_lisesi: 'Spor Lisesi',
  anaokulu: 'Anaokulu',
  ozel_egitim: 'Özel Eğitim',
  halk_egitim: 'Halk Eğitimi',
  diger_kurum: 'Diğer Kurum',
  diger: 'Diğer',
};

export const OKUL_DIGER_VALUE = '__DIGER__';
export const OKUL_OZEL_VALUE = '__OZEL__';

export function getSchoolsForDistrict(province, district) {
  const list = schoolsData[province]?.[district] || [];
  return list.map((s) => ({ name: s.name, typeLabel: SCHOOL_TYPE_LABELS[s.type] || 'Diğer' }));
}
