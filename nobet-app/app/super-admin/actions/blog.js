'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { listBlogPostsAdmin, getBlogPostById, upsertBlogPost, deleteBlogPost } from '@/lib/db/blog';

export async function fetchBlogPosts() {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    return { posts: await listBlogPostsAdmin(supabase) };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchBlogPost(id) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const post = await getBlogPostById(supabase, id);
    if (!post) return { error: 'Yazı bulunamadı.' };
    return { post };
  } catch (e) {
    return { error: e.message };
  }
}

export async function saveBlogPost(post) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    const { data: { user } } = await supabase.auth.getUser();
    const saved = await upsertBlogPost(supabase, post, user.id);
    revalidatePath('/super-admin/blog');
    revalidatePath('/blog');
    revalidatePath(`/blog/${saved.slug}`);
    return { post: saved };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeBlogPost(id) {
  const supabase = createClient();
  try {
    await requirePlatformAdmin(supabase);
    await deleteBlogPost(supabase, id);
    revalidatePath('/super-admin/blog');
    revalidatePath('/blog');
  } catch (e) {
    return { error: e.message };
  }
  redirect('/super-admin/blog');
}
