import { createClient } from '@/lib/supabase/server';
import { listPublishedPosts } from '@/lib/db/blog';
import { SITE_URL } from '@/lib/seo/constants';

// Yalnızca herkese açık pazarlama sayfaları — /dashboard, /super-admin,
// /share/[token] gibi kimlik doğrulama gerektiren veya kullanıcıya özel
// rotalar kasıtlı olarak dışarıda bırakıldı (bkz. robots.js disallow).
const ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/fiyatlandirma', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/sss', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/hakkimizda', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/kurumsal', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/gizlilik', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/kullanim-sartlari', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/cerez-politikasi', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/odeme-guvenligi', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/login', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/signup', priority: 0.8, changeFrequency: 'yearly' },
];

export default async function sitemap() {
  const now = new Date();
  const staticEntries = ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Yayınlanmış blog yazıları — sitemap'te olmayan bir sayfa Google
  // tarafından geç keşfedilir/hiç keşfedilmeyebilir, bu yüzden statik
  // rota listesine ek olarak DB'den çekiliyor. Hata olursa (ör. build
  // sırasında DB erişilemez) sitemap'in geri kalanı yine de üretilsin
  // diye boş diziye düşülüyor.
  const supabase = createClient();
  const posts = await listPublishedPosts(supabase).catch(() => []);

  const postEntries = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at || now),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
