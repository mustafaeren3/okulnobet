'use client';

import { motion } from 'framer-motion';

// Paylaşılan kart kabuğu — feature grid ve fiyatlandırma kartları kullanıyor.
export default function Card({ className = '', children, ...rest }) {
  return (
    <motion.div
      className={['card', className].filter(Boolean).join(' ')}
      whileHover={{ y: -3, boxShadow: '0 14px 32px rgba(0, 0, 0, 0.28)' }}
      transition={{ duration: 0.15 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
