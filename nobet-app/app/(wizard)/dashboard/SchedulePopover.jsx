'use client';

import { useEffect, useRef, useState } from 'react';

// Program tablosundaki TÜM işlem pencereleri (öğretmen seçme, değiştirme,
// silme — hem öğretmen nöbeti hem Görevli Müdür Yardımcısı bölümü) bu tek
// bileşeni kullanır, aynı tasarım dilini ve klavye desteğini paylaşsın diye
// (kullanıcı isteği). İki mod var:
// - mode="actions": kısa bir işlem menüsü (ör. "✏️ Değiştir" / "🗑️ Kaldır").
// - mode="picker": aranabilir olmayan basit bir kişi seçim listesi (ör.
//   boş hücreye "+" ile veya "Değiştir" ile açılan öğretmen/kişi listesi).
// Klavye: ESC kapatır, Enter vurgulanan öğeyi seçer, Yukarı/Aşağı listede
// gezer — üstteki kapsayıcıya odaklanılıp yakalanır (roving index deseni).
export default function SchedulePopover({ mode = 'actions', items, onSelect, onClose, emptyLabel }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) onSelect(item);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`schedule-popover schedule-popover-${mode}`}
      role={mode === 'actions' ? 'menu' : 'listbox'}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {!items.length && <div className="schedule-popover-empty">{emptyLabel || 'Seçenek yok'}</div>}
      {items.map((item, i) => (
        <button
          key={item.key}
          role={mode === 'actions' ? 'menuitem' : 'option'}
          aria-selected={mode === 'picker' ? i === activeIndex : undefined}
          className={`schedule-popover-item ${i === activeIndex ? 'active' : ''} ${item.danger ? 'danger' : ''}`}
          onMouseEnter={() => setActiveIndex(i)}
          onClick={() => onSelect(item)}
        >
          {item.icon && <item.icon size={13} />}
          {item.label}
        </button>
      ))}
    </div>
  );
}
