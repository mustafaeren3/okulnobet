'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { uploadMediaFile, removeMediaFile, updateMediaFile } from '../../actions/media';

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibrary({ initialItems }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.set('file', file);
    const res = await uploadMediaFile(formData);
    setUploading(false);
    if (res.error) { setError(res.error); return; }
    setItems((it) => [res.item, ...it]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(item) {
    if (!window.confirm(`"${item.original_name}" silinsin mi? Bu işlem geri alınamaz.`)) return;
    const res = await removeMediaFile(item.id, item.storage_path);
    if (res?.error) { setError(res.error); return; }
    setItems((it) => it.filter((x) => x.id !== item.id));
  }

  async function handleAltTextBlur(item, value) {
    if (value === item.alt_text) return;
    await updateMediaFile(item.id, { altText: value });
    setItems((it) => it.map((x) => (x.id === item.id ? { ...x, alt_text: value } : x)));
  }

  function handleCopy(url, id) {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Button asChild disabled={uploading}>
            <label className="cursor-pointer">
              <Upload size={14} /> {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </Button>
          <span className="text-xs text-muted-foreground">Maks. 5MB — resim ve video desteklenir.</span>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Henüz medya yüklenmedi.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex h-32 items-center justify-center bg-muted">
                {item.mime_type?.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.public_url} alt={item.alt_text || item.original_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">{item.mime_type || 'dosya'}</span>
                )}
              </div>
              <CardContent className="flex flex-col gap-2 p-3">
                <div className="truncate text-xs font-medium" title={item.original_name}>{item.original_name}</div>
                <div className="text-xs text-muted-foreground">{formatSize(item.size_bytes)}</div>
                <Input
                  defaultValue={item.alt_text}
                  placeholder="Alt text..."
                  className="h-7 text-xs"
                  onBlur={(e) => handleAltTextBlur(item, e.target.value)}
                />
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopy(item.public_url, item.id)}>
                    {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />} URL
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(item)} aria-label="Sil">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
