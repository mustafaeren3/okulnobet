'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select';
import { Button } from '../../ui/button';

const MAIL_TYPE_OPTIONS = [
  { value: 'all', label: 'Tüm Mail Türleri' },
  { value: 'confirmation', label: 'Doğrulama' },
  { value: 'recovery', label: 'Şifre Sıfırlama' },
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'pending', label: 'Bekliyor' },
  { value: 'sent', label: 'Gönderildi' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'opened', label: 'Açıldı' },
  { value: 'clicked', label: 'Tıklandı' },
  { value: 'verified', label: 'Doğrulandı' },
  { value: 'delayed', label: 'Gecikti' },
  { value: 'bounced', label: 'Bounce' },
  { value: 'complained', label: 'Spam Şikayeti' },
  { value: 'failed', label: 'Başarısız' },
];

// UserFilters.jsx ile AYNI desen (URL searchParams tek doğruluk kaynağı,
// bkz. o dosyadaki yorum) — sadece filtre alanları farklı.
export default function EmailCenterFilters({ search, mailType, status, dateFrom, dateTo }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(search || '');
  const [, startTransition] = useTransition();

  const updateParam = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set(key, value); else params.delete(key);
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }, [router, pathname, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== (search || '')) updateParam('search', inputValue);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const hasActiveFilters = Boolean(search || mailType || status || dateFrom || dateTo);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="E-posta veya okul ara..."
          className="pl-8"
        />
      </div>
      <Select value={mailType || 'all'} onValueChange={(v) => updateParam('mailType', v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Mail Türü" /></SelectTrigger>
        <SelectContent>
          {MAIL_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={status || 'all'} onValueChange={(v) => updateParam('status', v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Durum" /></SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input type="date" value={dateFrom || ''} onChange={(e) => updateParam('dateFrom', e.target.value)} className="w-40" />
      <Input type="date" value={dateTo || ''} onChange={(e) => updateParam('dateTo', e.target.value)} className="w-40" />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X size={14} /> Filtreleri temizle
        </Button>
      )}
    </div>
  );
}
