import { Card, CardContent } from './card';
import { cn } from '../lib/utils';

// Tüm dashboard özet kartları TEK bileşenden geçer — 12 farklı kart
// için 12 kez aynı JSX'i tekrarlamak yerine (bkz. CLAUDE.md: kod
// tekrarını azalt, section 18).
export function StatCard({ icon: Icon, label, value, hint, className }) {
  return (
    <Card className={cn('transition-colors hover:border-primary/40', className)}>
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
}
