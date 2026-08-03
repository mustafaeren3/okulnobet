// Marketing sayfalarının Next.js Metadata nesnesini tek noktadan üretir
// — title/description/canonical/OG/Twitter her sayfada aynı şekilde ve
// eksiksiz kurulsun diye (önceden bazı sayfalarda hiç metadata yoktu,
// bazılarında yalnızca title vardı). SAF fonksiyon — DB'ye dokunmaz,
// çağıran taraf (page.jsx/generateMetadata) veriyi CMS'ten çekip verir.
//
// ÖNEMLİ: Next.js, bir metadata alanını `undefined` olarak DÖNMEKLE o
// alanı HİÇ DÖNMEMEYİ aynı saymıyor — `{ title: undefined }` üst
// layout'un title.default'una düşmek yerine sayfayı başlıksız bırakıyor
// (canlıda görülüp düzeltildi, bkz. commit notu). Bu yüzden burada
// eksik alanlar objeye HİÇ EKLENMİYOR, `undefined` olarak set edilmiyor.
import { SITE_NAME, DEFAULT_OG_IMAGE, DEFAULT_DESCRIPTION } from './constants';

export function buildPageMetadata({ path, title, description, image, noindex = false }) {
  const desc = description || DEFAULT_DESCRIPTION;
  const fullTitle = `${title} — ${SITE_NAME}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  const metadata = {
    title,
    description: desc,
    // types.rss burada tekrarlanıyor çünkü Next.js `alternates` objesini
    // segment bazında bütün olarak değiştiriyor (deep-merge etmiyor) —
    // kökte bir kez tanımlayıp burada atlasaydık, bu fonksiyonu kullanan
    // her sayfada RSS keşif linki sessizce kaybolurdu.
    alternates: { canonical: path, types: { 'application/rss+xml': '/rss.xml' } },
    openGraph: {
      title: fullTitle,
      description: desc,
      url: path,
      siteName: SITE_NAME,
      locale: 'tr_TR',
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [ogImage],
    },
  };

  if (noindex) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}
