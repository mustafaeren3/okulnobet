import { createClient } from '@/lib/supabase/server';
import { listPublishedPosts } from '@/lib/db/blog';
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo/constants';

// Blog yayınlandığı anda RSS'e otomatik yansısın diye statik bir dosya
// değil, sitemap.js'teki aynı desenle her istekte listPublishedPosts'tan
// üretiliyor. XML'e basılan her metin kaçırılıyor (& < > ) — başlık/özet
// CMS'ten geldiği için ham haliyle basılırsa geçersiz XML üretebilir.
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const supabase = createClient();
  const posts = await listPublishedPosts(supabase).catch(() => []);

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = new Date(post.published_at || post.updated_at || Date.now()).toUTCString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)} Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>
    <language>tr-TR</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
