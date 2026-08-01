// Statik VARSAYILAN iletişim/sosyal medya değerleri — Client Component'lerin
// (ör. kurumsal/page.jsx'teki iletişim formu) import edebilmesi için
// Footer.jsx'ten AYRI bir dosyada. Footer.jsx artık next/headers kullanan
// bir Server Component (site_content'ten canlı veri çekiyor, bkz. Faz 2.3)
// — Client Component'ler next/headers'a dokunan hiçbir modülü import
// EDEMEZ, bu yüzden bu sabitler ayrıldı. Canlı (CMS'ten güncellenebilir)
// değerler için bkz. lib/data/siteContentDefaults.js ('contact'/'social').
export const CONTACT_EMAIL = 'iletisim@okulnobet.com';
export const SUPPORT_EMAIL = 'destek@okulnobet.com';
export const INSTAGRAM_URL = 'https://instagram.com/okulnobet';
export const INSTAGRAM_HANDLE = '@okulnobet';
