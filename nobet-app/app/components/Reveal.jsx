'use client';

import { motion } from 'framer-motion';

// Sayfa kaydırıldıkça bölümlerin hafifçe belirmesi için paylaşılan sarmalayıcı.
// Abartısız: yalnızca fade + 16px yukarı kayma, tek seferlik (viewport'a her
// girişte tekrar oynamaz — once: true).
export default function Reveal({ children, delay = 0, className = '', ...rest }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
