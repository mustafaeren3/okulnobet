import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPublishedPostBySlug } from '@/lib/db/blog';

export async function generateMetadata({ params }) {
  const supabase = createClient();
  const post = await getPublishedPostBySlug(supabase, params.slug);
  if (!post) return {};
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: post.cover_image_url ? { images: [post.cover_image_url] } : undefined,
  };
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BlogPostPage({ params }) {
  const supabase = createClient();
  const post = await getPublishedPostBySlug(supabase, params.slug);
  if (!post) notFound();

  return (
    <main className="mkt-main mkt-narrow">
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
    </main>
  );
}
