// Okul adı arama — MEB'in canlı okul servisinden derlenmiş ~55 bin kayıt
// (mebSchools.json, ~3MB). Bu dosya SADECE 'use server' action'ları
// içinden import edilmeli — client bileşenine asla import edilmemeli,
// aksi halde tüm veri client bundle'ına dahil olur.
import schoolsData from './mebSchools.json';
import { SCHOOL_TYPE_LABELS } from './schoolTypes';

export { SCHOOL_TYPE_LABELS };

export const OKUL_DIGER_VALUE = '__DIGER__';
export const OKUL_OZEL_VALUE = '__OZEL__';

export function getSchoolsForDistrict(province, district) {
  const list = schoolsData[province]?.[district] || [];
  return list.map((s) => ({ name: s.name, typeLabel: SCHOOL_TYPE_LABELS[s.type] || 'Diğer' }));
}
