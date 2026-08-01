import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { getBlogPostById } from '@/lib/db/blog';
import PostEditor from './PostEditor';

export default async function BlogEditPage({ params }) {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);

  if (params.id === 'new') {
    return <PostEditor post={null} />;
  }

  const post = await getBlogPostById(supabase, params.id);
  if (!post) notFound();
  return <PostEditor post={post} />;
}
