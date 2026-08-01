'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Genel amaçlı aç/kapa menü. trigger: (open, toggle) => ReactNode,
// children: menü içeriği (genelde <button className="dropdown-item">'lar).
// Şu an zorunlu bir kullanım yeri yok — gelecekteki ihtiyaçlar (kullanıcı
// menüsü vb.) için hazır, Modal'daki ESC/dış-tık kapatma desenini paylaşır.
export default function Dropdown({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  return (
    <div className="dropdown-root" ref={rootRef}>
      {trigger(open, () => setOpen((v) => !v))}
      <AnimatePresence>
        {open && (
          <motion.div
            className={`dropdown-menu dropdown-${align}`}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            role="menu"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
