'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, MapPin, Search } from 'lucide-react';

const DEBOUNCE_MS = 250;
const ROW_HEIGHT = 52;
const VISIBLE_ROWS = 6; // ~20 sonuç sanallaştırma ile scroll edilir, aynı anda ~6 satır görünür

// Debounce'u ayrı bir hook'a almak (Dashboard.jsx'teki TeacherRow
// deneyiminden — bkz. o dosyadaki useCallback notu): her tuş vuruşunda
// arama action'ını TETİKLEMİYOR, kullanıcı yazmayı 250ms durdurunca
// tetikliyor. useEffect + setTimeout, ekstra bağımlılık gerekmiyor.
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// Tek bir sonuç satırı — memo() ile sarılı: sanallaştırıcı her scroll/
// highlight değişiminde TÜM satırları değil, sadece prop'u değişeni
// yeniden render etsin diye (aynı TeacherRow deseni, bkz. Dashboard.jsx).
const ResultRow = memo(function ResultRow({ school, isHighlighted, onHover, onSelect, style }) {
  return (
    <div
      style={{ ...style, cursor: 'pointer', background: isHighlighted ? 'var(--surface2)' : 'transparent' }}
      className="school-search-row"
      onMouseEnter={onHover}
      onMouseDown={(e) => { e.preventDefault(); onSelect(); }}
      role="option"
      aria-selected={isHighlighted}
    >
      <div style={{ fontWeight: 500 }}>{school.name}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
        <MapPin size={10} /> {school.district} / {school.province}
      </div>
    </div>
  );
});

// Okul akıllı arama kutusu — eski İl → İlçe → Okul kademeli seçimin
// yerini alıyor. Tek input, Türkçe karakter duyarsız + yazım hatası
// toleranslı arama (bkz. lib/data/schoolSearch.js), sanallaştırılmış
// sonuç listesi (55 bin okul olsa da her tuş vuruşunda sadece görünen
// ~6 satır DOM'a yazılır), klavye + mouse ile birlikte kullanılabilir.
export default function SchoolSearchField({ searchAction, onSelect, onManualEntry }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef(null);
  const parentRef = useRef(null);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  useEffect(() => {
    let cancelled = false;
    if (!debouncedQuery.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    searchAction(debouncedQuery).then((list) => {
      if (cancelled) return;
      setResults(list);
      setHighlightedIndex(0);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, searchAction]);

  // Dropdown dışına tıklanınca kapansın.
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  function selectSchool(school) {
    onSelect(school);
    setSelectedLabel(school.name);
    setQuery(school.name);
    setOpen(false);
  }

  function handleChange(value) {
    setQuery(value);
    setSelectedLabel('');
    setOpen(true);
    onSelect(null);
  }

  function handleKeyDown(e) {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => {
        const next = Math.min(i + 1, results.length - 1);
        rowVirtualizer.scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => {
        const next = Math.max(i - 1, 0);
        rowVirtualizer.scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const picked = results[highlightedIndex];
      if (picked) selectSchool(picked);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length > 0 && query !== selectedLabel;

  return (
    <div className="auth-field" ref={containerRef} style={{ position: 'relative' }}>
      <label>Okul Adı</label>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="İl, ilçe veya okul adı yazın..."
          style={{ paddingLeft: 32 }}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {loading && <Loader2 size={15} className="spin" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />}
      </div>

      {showDropdown && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
          }}
        >
          {loading && results.length === 0 ? (
            <div style={{ padding: 14, fontSize: 13, color: 'var(--muted)' }}>Aranıyor...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Aramanıza uygun okul bulunamadı.</div>
              <button type="button" className="btn btn-outline" style={{ width: '100%' }} onMouseDown={(e) => { e.preventDefault(); onManualEntry(); setOpen(false); }}>
                Okulumu listede bulamadım, elle gireceğim
              </button>
            </div>
          ) : (
            <>
              <div ref={parentRef} style={{ maxHeight: ROW_HEIGHT * VISIBLE_ROWS, overflowY: 'auto' }}>
                <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <ResultRow
                      key={virtualRow.key}
                      school={results[virtualRow.index]}
                      isHighlighted={virtualRow.index === highlightedIndex}
                      onHover={() => setHighlightedIndex(virtualRow.index)}
                      onSelect={() => selectSchool(results[virtualRow.index])}
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: ROW_HEIGHT, transform: `translateY(${virtualRow.start}px)`,
                        padding: '8px 12px', borderBottom: '1px solid var(--border)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', borderRadius: 0, borderTop: '1px solid var(--border)' }}
                onMouseDown={(e) => { e.preventDefault(); onManualEntry(); setOpen(false); }}
              >
                Okulumu listede bulamadım, elle gireceğim
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
