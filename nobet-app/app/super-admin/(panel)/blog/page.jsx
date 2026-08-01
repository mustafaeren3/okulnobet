import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { listBlogPostsAdmin } from '@/lib/db/blog';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { DataTable } from '../../ui/data-table';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('tr-TR');
}

export default async function BlogListPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const posts = await listBlogPostsAdmin(supabase);

  const columns = [
    { key: 'title', header: 'Başlık', cell: (p) => <Link href={`/super-admin/blog/${p.id}`} className="font-medium hover:underline">{p.title}</Link> },
    { key: 'category', header: 'Kategori', cell: (p) => p.category || '—' },
    { key: 'status', header: 'Durum', cell: (p) => <Badge variant={p.status === 'published' ? 'success' : 'secondary'}>{p.status === 'published' ? 'Yayında' : 'Taslak'}</Badge> },
    { key: 'created_at', header: 'Oluşturma', cell: (p) => formatDate(p.created_at) },
    { key: 'published_at', header: 'Yayın Tarihi', cell: (p) => formatDate(p.published_at) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Blog</h1>
          <p className="text-sm text-muted-foreground">Yazı oluştur, taslak kaydet, yayınla.</p>
        </div>
        <Button asChild><Link href="/super-admin/blog/new"><Plus size={14} /> Yeni Yazı</Link></Button>
      </div>
      <Card><DataTable columns={columns} data={posts} emptyMessage="Henüz blog yazısı yok." /></Card>
    </div>
  );
}
