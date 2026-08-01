'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../ui/card';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Label } from '../../../ui/label';
import { Button } from '../../../ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../ui/select';
import { saveBlogPost, removeBlogPost } from '../../../actions/blog';

function slugify(str) {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PostEditor({ post }) {
  const router = useRouter();
  const isNew = !post;
  const [draft, setDraft] = useState({
    id: post?.id,
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    coverImageUrl: post?.cover_image_url || '',
    category: post?.category || '',
    tags: (post?.tags || []).join(', '),
    status: post?.status || 'draft',
    metaTitle: post?.meta_title || '',
    metaDescription: post?.meta_description || '',
    publishedAt: post?.published_at || null,
  });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function set(key, value) {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  async function handleSave(status) {
    if (!draft.title.trim()) { setError('Başlık gerekli.'); return; }
    if (!draft.slug.trim()) { setError('Slug gerekli.'); return; }
    setBusy(true);
    setError('');
    const res = await saveBlogPost({
      ...draft,
      status: status || draft.status,
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    router.push(`/super-admin/blog/${res.post.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`"${draft.title}" silinsin mi?`)) return;
    setBusy(true);
    await removeBlogPost(draft.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/super-admin/blog" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Blog listesine dön
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{isNew ? 'Yeni Yazı' : 'Yazıyı Düzenle'}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5"><Label>Başlık</Label><Input value={draft.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug (/blog/...)</Label>
              <Input value={draft.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} />
            </div>
            <div className="flex flex-col gap-1.5"><Label>Özet</Label><Textarea value={draft.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} /></div>
            <div className="flex flex-col gap-1.5"><Label>İçerik (HTML)</Label><Textarea value={draft.content} onChange={(e) => set('content', e.target.value)} rows={16} className="font-mono text-xs" /></div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Yayın</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Durum</Label>
                <Select value={draft.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="published">Yayında</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Kategori</Label><Input value={draft.category} onChange={(e) => set('category', e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Etiketler (virgülle)</Label><Input value={draft.tags} onChange={(e) => set('tags', e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Kapak Görseli URL</Label><Input value={draft.coverImageUrl} onChange={(e) => set('coverImageUrl', e.target.value)} placeholder="Medya Kütüphanesi'nden kopyala" /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5"><Label>Meta Title</Label><Input value={draft.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Meta Description</Label><Textarea value={draft.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} rows={2} /></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      <CardFooter className="flex gap-2 px-0">
        <Button onClick={() => handleSave('draft')} disabled={busy} variant="outline"><Save size={14} /> Taslak Kaydet</Button>
        <Button onClick={() => handleSave('published')} disabled={busy}><Save size={14} /> Yayınla</Button>
        {!isNew && <Button variant="destructive" onClick={handleDelete} disabled={busy}><Trash2 size={14} /> Sil</Button>}
      </CardFooter>
    </div>
  );
}
