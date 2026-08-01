'use client';

import Button from './Button';

// Basit ileri/geri sayfalama — super-admin/schools/page.jsx'in mevcut
// filters.page/totalPages state şekliyle birebir uyumlu.
export default function Pagination({ page, totalPages, onPageChange, totalCount, itemLabel = 'kayıt' }) {
  return (
    <nav className="pagination" aria-label="Sayfalama">
      {typeof totalCount === 'number' && (
        <span className="pagination-count">{totalCount} {itemLabel}, sayfa {page} / {totalPages}</span>
      )}
      <div className="pagination-controls">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Önceki sayfa"
        >
          ← Önceki
        </Button>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Sonraki sayfa"
        >
          Sonraki →
        </Button>
      </div>
    </nav>
  );
}
