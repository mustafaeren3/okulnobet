// Blog — admin CRUD (taslak/yayın dahil tüm yazılar) + herkese açık
// yayınlanmış yazı erişimi. RLS ile korunuyor (bkz. migration 0034:
// public sadece status='published' görebilir, admin hepsini görebilir).

export async function listBlogPostsAdmin(supabase) {
  const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getBlogPostById(supabase, id) {
  const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertBlogPost(supabase, post, userId) {
  const patch = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content: post.content || '',
    cover_image_url: post.coverImageUrl || null,
    status: post.status || 'draft',
    category: post.category || null,
    tags: post.tags || [],
    meta_title: post.metaTitle || null,
    meta_description: post.metaDescription || null,
    updated_at: new Date().toISOString(),
  };
  if (post.status === 'published' && !post.publishedAt) {
    patch.published_at = new Date().toISOString();
  }
  if (post.id) {
    const { data, error } = await supabase.from('blog_posts').update(patch).eq('id', post.id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabase.from('blog_posts').insert({ ...patch, author_id: userId }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBlogPost(supabase, id) {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Herkese açık ──────────────────────────────────────────────────
export async function listPublishedPosts(supabase) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, category, published_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPublishedPostBySlug(supabase, slug) {
  const { data, error } = await supabase.from('blog_posts').select('*').eq('status', 'published').eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
