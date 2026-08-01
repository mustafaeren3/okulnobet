'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select';
import { Button } from '../../ui/button';

const PLAN_OPTIONS = [
  { value: 'all', label: 'Tüm Planlar' },
  { value: 'free', label: 'Ücretsiz' },
  { value: 'standard', label: 'Standart' },
  { value: 'enterprise', label: 'Kurumsal' },
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'active', label: 'Aktif' },
  { value: 'past_due', label: 'Ödeme Gecikti' },
  { value: 'expired', label: 'Süresi Doldu' },
  { value: 'cancelled', label: 'İptal Edildi' },
  { value: 'frozen', label: 'Dondurulmuş' },
];

// Tek Client Component "ada" — arama/filtre kontrolleri URL'i güncelliyor,
// asıl veri sayfası (page.jsx) Server Component olarak kalıyor (bkz.
// dosya üstü yorum). 300ms debounce ile arama kutusu her tuşta değil,
// yazma durunca URL'i değiştiriyor.
export default function UserFilters({ search, plan, status, quick }) {
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

  const hasActiveFilters = Boolean(search || plan || status || quick);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ad, e-posta veya okul ara..."
          className="pl-8"
        />
      </div>
      <Select value={plan || 'all'} onValueChange={(v) => updateParam('plan', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Plan" /></SelectTrigger>
        <SelectContent>
          {PLAN_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={status || 'all'} onValueChange={(v) => updateParam('status', v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Durum" /></SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X size={14} /> Filtreleri temizle
        </Button>
      )}
    </div>
  );
}
