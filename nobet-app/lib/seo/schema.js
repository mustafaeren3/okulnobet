// Schema.org JSON-LD üreticileri — SAF fonksiyonlar (DB/fetch/Next
// bağımlılığı yok, engine'deki gibi düz veri girer düz veri çıkar).
// Render eden bileşen: app/components/JsonLd.jsx.
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from './constants';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    sameAs: ['https://instagram.com/okulnobet'],
  };
}

// SearchAction/potentialAction bilinçli olarak eklenmedi — Google bu
// işareti yalnızca gerçek bir site-içi arama özelliği varsa geçerli
// sayıyor (bkz. sitelinks searchbox belgeleri); OkulNöbet'te böyle bir
// arama özelliği yok, işlevsiz bir hedef eklemek yapılandırılmış veri
// kurallarına aykırı bir anti-pattern olurdu.
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'tr-TR',
  };
}

export function softwareApplicationSchema({ price, priceCurrency = 'TRY' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: "Türkiye'deki okullar için otomatik, adil ve kurallara uygun nöbet/görev programı sistemi.",
    offers: {
      '@type': 'Offer',
      price: String(price),
      priceCurrency,
    },
  };
}

// items: [{ name, path }] — path '/' ise mutlak URL kök olur, aksi halde
// SITE_URL + path. Breadcrumbs.jsx'teki GÖRÜNÜR listeyle birebir aynı
// veriden üretilmeli (Google, görünür içerikle uyuşmayan yapılandırılmış
// veriyi reddedebilir/yok sayabilir).
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === '/' ? '' : item.path}`,
    })),
  };
}

// Blog yazıları için BlogPosting — image/datePublished/dateModified
// olmadan da geçerli ama varsa Google'a tazelik/yazar sinyali verir.
export function articleSchema({ headline, description, path, image, datePublished, dateModified, authorName }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    url: `${SITE_URL}${path}`,
    mainEntityOfPage: `${SITE_URL}${path}`,
    image: image ? [image] : [`${SITE_URL}${DEFAULT_OG_IMAGE}`],
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    author: { '@type': 'Organization', name: authorName || SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
    },
  };
}

// items: [{ q, a }] — a düz metin olmalı (JSX/HTML değil); sayfadaki
// görünür SSS metniyle birebir aynı olması gerekiyor.
export function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}
