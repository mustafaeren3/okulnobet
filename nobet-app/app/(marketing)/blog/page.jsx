import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { listPublishedPosts } from '@/lib/db/blog';
import { getSeoMeta } from '@/lib/db/cms';
import { buildPageMetadata } from '@/lib/seo/metadata';
import Breadcrumbs from '../../components/Breadcrumbs';

export async function generateMetadata() {
  const supabase = createClient();
  const seo = await getSeoMeta(supabase, '/blog').catch(() => null);
  return buildPageMetadata({
    path: '/blog',
    title: seo?.title || 'Blog',
    description: seo?.description || 'OkulNöbet blog — nöbet yönetimi, MEB mevzuatı ve okul idaresi üzerine yazılar.',
  });
}

const BREADCRUMB_ITEMS = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Blog', path: '/blog' },
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BlogListPage() {
  const supabase = createClient();
  const posts = await listPublishedPosts(supabase);

  return (
    <main className="mkt-main mkt-narrow">
      <Breadcrumbs items={BREADCRUMB_ITEMS} />
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Blog</h1>
      </div>
      {posts.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Henüz yazı yayınlanmadı.</p>
      ) : (
        <div className="mkt-section" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {posts.map((p) => (
            <article key={p.id}>
              <Link href={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                <h2 style={{ marginBottom: 4 }}>{p.title}</h2>
              </Link>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>
                {formatDate(p.published_at)}{p.category ? ` · ${p.category}` : ''}
              </p>
              {p.excerpt && <p>{p.excerpt}</p>}
              <Link href={`/blog/${p.slug}`} className="mkt-hero-secondary-link">Devamını oku →</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
