import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

// Server Component — sayfa linkleri düz <Link href> (URL searchParams
// güncelliyor), istemci tarafında ayrı bir "sayfa state"i yok.
export function PaginationBar({ page, pageSize, totalCount, buildHref }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        {totalCount === 0 ? '0 kayıt' : `${from}–${to} / ${totalCount} kayıt`}
      </span>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft size={14} /> Önceki
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(page - 1)}>
              <ChevronLeft size={14} /> Önceki
            </Link>
          </Button>
        )}
        <span className="tabular-nums">{page} / {totalPages}</span>
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Sonraki <ChevronRight size={14} />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(page + 1)}>
              Sonraki <ChevronRight size={14} />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
