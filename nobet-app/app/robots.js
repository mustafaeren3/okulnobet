const BASE_URL = 'https://okulnobet.com';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Kimlik doğrulama gerektiren / kullanıcıya özel alanlar arama
      // motorlarınca taranmasın.
      disallow: ['/dashboard', '/super-admin', '/share/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
