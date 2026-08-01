import Link from 'next/link';
import { Card, CardContent } from './card';
import { cn } from '../lib/utils';

// Tüm dashboard özet kartları TEK bileşenden geçer — 12 farklı kart
// için 12 kez aynı JSX'i tekrarlamak yerine (bkz. CLAUDE.md: kod
// tekrarını azalt, section 18). href verilirse kart tıklanabilir olur —
// Kullanıcı Yönetimi'nde ilgili hazır filtreyle açılır (bkz.
// lib/db/platformAdmin.js p_quick_filter, migration 0032).
export function StatCard({ icon: Icon, label, value, hint, href, className }) {
  const content = (
    <Card className={cn('transition-colors', href && 'cursor-pointer hover:border-primary/40', className)}>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon size={18} />
          </div>
        )}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
