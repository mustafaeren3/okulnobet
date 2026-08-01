'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';

// Özellikler/Referanslar/SSS — üçü de aynı şekil: bir dizi, her eleman
// birkaç metin alanı. Üç ayrı form yazmak yerine TEK jenerik editör
// (CLAUDE.md: kod tekrarını azalt) — `fields` hangi anahtarların hangi
// etiketle gösterileceğini tanımlar.
export default function ArrayFieldEditor({ items, fields, onChange, addLabel, emptyItem }) {
  function updateItem(index, key, value) {
    const next = items.map((it, i) => (i === index ? { ...it, [key]: value } : it));
    onChange(next);
  }
  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index));
  }
  function addItem() {
    onChange([...items, { ...emptyItem }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-1 flex-col gap-2">
              {fields.map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <Label className="text-xs">{f.label}</Label>
                  {f.multiline ? (
                    <Textarea value={item[f.key] || ''} onChange={(e) => updateItem(i, f.key, e.target.value)} rows={2} />
                  ) : (
                    <Input value={item[f.key] || ''} onChange={(e) => updateItem(i, f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeItem(i)} aria-label="Kaldır">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addItem} className="w-fit">
        <Plus size={14} /> {addLabel}
      </Button>
    </div>
  );
}
