'use client';

import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

// Henüz çekilmiş bir ürün videosu yok — bu, o alanı ayıran bir yer tutucu.
// Gerçek video hazır olduğunda <video>/embed ile değiştirilecek.
export default function VideoPlaceholder({ label = 'Ürün Demosu — Yakında' }) {
  return (
    <div className="video-placeholder">
      <motion.button
        type="button"
        className="video-placeholder-play"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15 }}
        aria-label={label}
        disabled
      >
        <Play size={26} fill="currentColor" />
      </motion.button>
      <span className="video-placeholder-label">{label}</span>
    </div>
  );
}
