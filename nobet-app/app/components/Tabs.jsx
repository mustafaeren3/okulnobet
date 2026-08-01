'use client';

import { motion } from 'framer-motion';

// Genel amaçlı sekme çubuğu — aktif sekmenin altındaki çizgi framer-motion
// layoutId ile kayarak geçiş yapar. items: [{ key, label }]. Kontrollü
// bileşen: aktif durumu ve tıklama mantığı çağıran taraftadır.
export default function Tabs({ items, activeKey, onChange, layoutId = 'tabs-indicator' }) {
  return (
    <div className="tabs-bar" role="tablist">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={['tabs-bar-btn', active ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(item.key)}
          >
            {item.label}
            {active && <motion.span className="tabs-bar-indicator" layoutId={layoutId} transition={{ duration: 0.2 }} />}
          </button>
        );
      })}
    </div>
  );
}
