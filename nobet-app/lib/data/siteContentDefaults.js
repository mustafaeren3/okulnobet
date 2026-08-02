// site_content'teki her key için VARSAYILAN değer — DB'de o key hiç
// yoksa (yeni kurulum, ya da admin panelinden hiç düzenlenmemiş) hem
// canlı site hem admin panel form pre-fill'i bunu kullanır. Tek kaynak
// — iki yerde aynı metni tekrar yazmamak için (app/page.jsx, Footer.jsx
// ve admin panel formları hepsi buradan okur).
export const SITE_CONTENT_DEFAULTS = {
  hero: {
    title: 'OkulNöbet ile Programınızı\nDakikalar İçinde Oluşturun',
    subtitle: 'Öğretmenleri MEB teşkilat şemasından otomatik aktarın, nöbet yerlerini ve kuralları belirleyin; adil nöbet çizelgenizi birkaç dakikada oluşturup Word olarak yazdırın ve panoya asın.',
    ctaPrimaryLabel: 'Ücretsiz Başla',
    ctaPrimaryHref: '/signup',
    ctaSecondaryLabel: 'Fiyatlandırmayı gör →',
    ctaSecondaryHref: '/fiyatlandirma',
  },
  features: {
    items: [
      { icon: 'Repeat2', title: 'Otomatik Rotasyon', description: 'Haftalık veya aylık dönme düzeni ile her öğretmen sırayla, adil şekilde nöbet tutar.' },
      { icon: 'Scale', title: 'Kurallara Uygun', description: 'Branş, gün kısıtı, izin/rapor ve çift nöbet kuralları otomatik uygulanır.' },
      { icon: 'Flag', title: 'MEB Tatil Takvimi', description: 'Resmi tatiller tek tuşla yüklenir, nöbet sırası tatillerde ilerlemez.' },
      { icon: 'Printer', title: 'Resmi Evrak Çıktısı', description: 'İmza bölümlü, yazdırmaya hazır nöbet çizelgesi oluştur.' },
    ],
  },
  testimonials: {
    items: [
      {
        role: 'Müdür Yardımcısı',
        org: 'Devlet Ortaokulu',
        quote: 'Nöbet çizelgesini hazırlamak eskiden saatler sürüyordu.\nŞimdi öğretmenleri tek tek yazmıyoruz.\nMEB teşkilat şemasından birkaç saniyede aktarıyoruz.\nKuralları belirleyip programı oluşturuyoruz.',
      },
      {
        role: 'Okul Müdürü',
        org: 'Anadolu Lisesi',
        quote: 'Eskiden her ay aynı tartışmalar yaşanıyordu.\nŞimdi sistem dağılımı adaletli yaptığı için itirazları büyük ölçüde ortadan kalktı.',
      },
      {
        role: 'Müdür Yardımcısı',
        org: 'Devlet İlkokulu',
        quote: 'Program hazır olduktan sonra\nWord çıktısını alıp doğrudan panoya asıyoruz.\nTüm süreç birkaç dakika içinde tamamlanıyor.',
      },
    ],
  },
  faq: {
    items: [
      { q: 'OkulNöbet tam olarak ne yapıyor?', a: 'Okulundaki öğretmen ve nöbet bölgelerini tanımlıyorsun; sistem, belirlediğin kurallara (branş, gün kısıtı, çift nöbet vb.) uyarak ve adil bir rotasyonla otomatik nöbet programı üretiyor. Elle düzenleme ve kilitleme her zaman mümkün.' },
      { q: 'Ücretsiz deneme var mı?', a: 'Süre sınırı yok — ücretsiz kaydolup okulunu kurabilir, tüm dönem için programı üretebilirsin. Ücretsiz planda üretilen programın yalnızca ilk ayı görüntülenebilir ve okul toplam 1 kez tam program üretebilir.' },
      { q: 'Fiyat nasıl belirleniyor?', a: 'Standart plan sabit bir yıllık fiyattır, öğretmen sayısından bağımsızdır. Güncel fiyatı Fiyatlandırma sayfasında görebilirsin.' },
      { q: 'Verilerimiz güvende mi?', a: 'Her okulun verisi diğer okullardan tamamen izole tutulur (satır seviyesi güvenlik). Detaylar için Gizlilik Politikası sayfasına bakabilirsin.' },
      { q: 'Aboneliğimi iptal edebilir miyim?', a: 'Evet, istediğin zaman iptal edebilirsin. İptal sonrası mevcut fatura döneminin sonuna kadar kullanıma devam edebilirsin.' },
    ],
  },
  footer: {
    description: "Türkiye'deki okullar için otomatik, adil ve kurallara uygun nöbet/görev programı sistemi.",
    copyrightName: 'OkulNöbet',
  },
  contact: {
    email: 'iletisim@okulnobet.com',
    supportEmail: 'destek@okulnobet.com',
    phone: '',
  },
  social: {
    instagramUrl: 'https://instagram.com/okulnobet',
    instagramHandle: '@okulnobet',
  },
  legal_privacy: { bodyHtml: '' },
  legal_terms: { bodyHtml: '' },
  legal_cookies: { bodyHtml: '' },
  global_settings: {
    siteName: 'OkulNöbet',
    siteDescription: "Türkiye'deki okullar için otomatik, adil ve kurallara uygun nöbet/görev programı sistemi.",
    domain: 'okulnobet.com',
    supportEmail: 'destek@okulnobet.com',
    phone: '',
    smtpHost: '', smtpPort: '', smtpUser: '', smtpFrom: '',
    gaId: '', gtmId: '', gscVerification: '', clarityId: '', metaPixelId: '',
    logoUrl: '', faviconUrl: '', themeColor: '',
  },
};

export const SITE_CONTENT_LABELS = {
  hero: 'Hero (Ana Başlık)',
  features: 'Özellik Kartları',
  testimonials: 'Referanslar',
  faq: 'Sık Sorulan Sorular',
  footer: 'Footer',
  contact: 'İletişim Bilgileri',
  social: 'Sosyal Medya',
  legal_privacy: 'KVKK & Gizlilik Politikası',
  legal_terms: 'Kullanım Şartları',
  legal_cookies: 'Çerez Politikası',
  global_settings: 'Genel Ayarlar',
};

export function withDefaults(key, value) {
  const def = SITE_CONTENT_DEFAULTS[key] || {};
  return { ...def, ...(value || {}) };
}
