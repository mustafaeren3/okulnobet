// Okul türü sözlüğü — schools.school_type sütununun CHECK kısıtıyla
// (supabase/migrations/0029_signup_v2_school_type_no_phone.sql) birebir
// aynı anahtarları kullanır. Küçük, statik veri — client bileşeninde
// doğrudan kullanılabilir. mebSchoolLookup.js (büyük JSON, SADECE server
// action'dan import edilmeli) bu sözlüğü buradan tekrar kullanır.
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
