'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { saveSeoMeta } from '../../actions/cms';

const KNOWN_PATHS = ['/', '/fiyatlandirma', '/hakkimizda', '/sss', '/kurumsal', '/odeme-guvenligi', '/gizlilik', '/kullanim-sartlari', '/cerez-politikasi', '/blog'];

const EMPTY = { title: '', description: '', keywords: '', canonical: '', og_title: '', og_description: '', og_image: '', twitter_card: 'summary_large_image', json_ld: '', noindex: false };

// Her sayfa için ayrı bir tablo satırı değil, tek bir Dialog form —
// 10 sayfa için 10 ayrı sayfa/route açmak yerine (CLAUDE.md: kod
// tekrarını azalt) TEK component, path parametreyle çalışıyor.
export default function SeoEditor({ initialRows }) {
  const [rowsByPath, setRowsByPath] = useState(() => Object.fromEntries(initialRows.map((r) => [r.path, r])));
  const [openPath, setOpenPath] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function openEditor(path) {
    const existing = rowsByPath[path];
    setDraft(existing ? { ...EMPTY, ...existing, json_ld: existing.json_ld ? JSON.stringify(existing.json_ld, null, 2) : '' } : EMPTY);
    setOpenPath(path);
    setError('');
  }

  async function handleSave() {
    setBusy(true);
    setError('');
    let jsonLd = null;
    if (draft.json_ld.trim()) {
      try { jsonLd = JSON.parse(draft.json_ld); } catch { setBusy(false); setError('JSON-LD geçerli bir JSON değil.'); return; }
    }
    const res = await saveSeoMeta(openPath, { ...draft, json_ld: jsonLd });
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setRowsByPath((r) => ({ ...r, [openPath]: { ...draft, path: openPath, json_ld: jsonLd } }));
    setOpenPath(null);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sayfa</TableHead>
            <TableHead>Meta Title</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {KNOWN_PATHS.map((path) => {
            const row = rowsByPath[path];
            return (
              <TableRow key={path}>
                <TableCell className="font-mono text-xs">{path}</TableCell>
                <TableCell>{row?.title || <span className="text-muted-foreground">Varsayılan</span>}</TableCell>
                <TableCell>
                  {row?.noindex ? <Badge variant="destructive">noindex</Badge> : <Badge variant="success">indexlenir</Badge>}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => openEditor(path)}>
                    <Pencil size={13} /> Düzenle
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={openPath !== null} onOpenChange={(o) => !o && setOpenPath(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>SEO — {openPath}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5"><Label>Meta Title</Label><Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label>Meta Description</Label><Textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={2} /></div>
            <div className="flex flex-col gap-1.5"><Label>Keywords (virgülle ayrılmış)</Label><Input value={draft.keywords} onChange={(e) => setDraft((d) => ({ ...d, keywords: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label>Canonical URL</Label><Input value={draft.canonical} onChange={(e) => setDraft((d) => ({ ...d, canonical: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><Label>OG Title</Label><Input value={draft.og_title} onChange={(e) => setDraft((d) => ({ ...d, og_title: e.target.value }))} /></div>
              <div className="flex flex-col gap-1.5"><Label>OG Image URL</Label><Input value={draft.og_image} onChange={(e) => setDraft((d) => ({ ...d, og_image: e.target.value }))} /></div>
            </div>
            <div className="flex flex-col gap-1.5"><Label>OG Description</Label><Textarea value={draft.og_description} onChange={(e) => setDraft((d) => ({ ...d, og_description: e.target.value }))} rows={2} /></div>
            <div className="flex flex-col gap-1.5"><Label>JSON-LD (Schema.org, geçerli JSON)</Label><Textarea value={draft.json_ld} onChange={(e) => setDraft((d) => ({ ...d, json_ld: e.target.value }))} rows={5} className="font-mono text-xs" /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.noindex} onChange={(e) => setDraft((d) => ({ ...d, noindex: e.target.checked }))} />
              Arama motorlarından gizle (noindex)
            </label>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPath(null)} disabled={busy}>Vazgeç</Button>
            <Button onClick={handleSave} disabled={busy}>{busy ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
