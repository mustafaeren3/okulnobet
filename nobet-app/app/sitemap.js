const BASE_URL = 'https://okulnobet.com';

// Yalnızca herkese açık pazarlama sayfaları — /dashboard, /super-admin,
// /share/[token] gibi kimlik doğrulama gerektiren veya kullanıcıya özel
// rotalar kasıtlı olarak dışarıda bırakıldı.
const ROUTES = [
  { path: '/', priority: 1 },
  { path: '/fiyatlandirma', priority: 0.9 },
  { path: '/sss', priority: 0.7 },
  { path: '/hakkimizda', priority: 0.6 },
  { path: '/kurumsal', priority: 0.6 },
  { path: '/gizlilik', priority: 0.3 },
  { path: '/kullanim-sartlari', priority: 0.3 },
  { path: '/odeme-guvenligi', priority: 0.3 },
  { path: '/login', priority: 0.4 },
  { path: '/signup', priority: 0.8 },
];

export default function sitemap() {
  const lastModified = new Date();
  return ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified,
    priority: r.priority,
  }));
}
