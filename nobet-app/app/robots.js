import { SITE_URL } from '@/lib/seo/constants';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Kimlik doğrulama gerektiren / kullanıcıya özel alanlar arama
      // motorlarınca taranmasın. (wizard) route group'undaki diğer
      // klasörler (account, teachers, rules, vb.) gerçek route değil —
      // hepsi tek /dashboard sayfasının sekmeleri, bkz. o klasörlerdeki
      // "Tek sayfa" notu — ayrıca disallow edilmelerine gerek yok.
      disallow: ['/dashboard', '/super-admin', '/share/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
