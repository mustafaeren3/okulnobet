import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPublishedPostBySlug } from '@/lib/db/blog';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { articleSchema, faqSchema } from '@/lib/seo/schema';
import Breadcrumbs from '../../../components/Breadcrumbs';
import JsonLd from '../../../components/JsonLd';

export async function generateMetadata({ params }) {
  const supabase = createClient();
  const post = await getPublishedPostBySlug(supabase, params.slug);
  if (!post) return {};
  return buildPageMetadata({
    path: `/blog/${params.slug}`,
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    image: post.cover_image_url || undefined,
  });
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BlogPostPage({ params }) {
  const supabase = createClient();
  const post = await getPublishedPostBySlug(supabase, params.slug);
  if (!post) notFound();

  const breadcrumbItems = [
    { name: 'Ana Sayfa', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${params.slug}` },
  ];

  return (
    <main className="mkt-main mkt-narrow">
      <JsonLd data={articleSchema({
        headline: post.title,
        description: post.meta_description || post.excerpt,
        path: `/blog/${params.slug}`,
        image: post.cover_image_url,
        datePublished: post.published_at,
        dateModified: post.updated_at,
      })}
      />
      {/* FAQ bölümü post.faq'dan geliyorsa görünür liste + FAQPage şeması
          aynı diziden üretilir (bkz. lib/seo/schema.js) — /sss'teki desenin
          aynısı, görünür içerikle yapılandırılmış veri hep eşleşsin diye. */}
      {Array.isArray(post.faq) && post.faq.length > 0 && <JsonLd data={faqSchema(post.faq)} />}
      <Breadcrumbs items={breadcrumbItems} />
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>{post.title}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          {formatDate(post.published_at)}{post.category ? ` · ${post.category}` : ''}
        </p>
      </div>
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt={post.title} style={{ width: '100%', borderRadius: 12, marginBottom: 24 }} />
      )}
      <div className="mkt-section" dangerouslySetInnerHTML={{ __html: post.content }} />
      {Array.isArray(post.faq) && post.faq.length > 0 && (
        <div className="mkt-section" id="sss">
          <h2>Sık Sorulan Sorular</h2>
          {post.faq.map((item) => (
            <div className="mkt-faq-item" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
