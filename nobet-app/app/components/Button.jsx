'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const MotionLink = motion.create(Link);

const HOVER = { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 }, transition: { duration: 0.15 } };

// Tek buton bileşeni — href verilirse next/link, verilmezse <button> render eder.
// Kullanım: Navbar, Footer, Hero CTA'ları, form submit butonları.
export default function Button({ href, variant = 'primary', size = 'md', type = 'button', className = '', children, ...rest }) {
  const classes = ['btn', `btn-${variant}`, size === 'lg' ? 'btn-lg' : '', className].filter(Boolean).join(' ');

  if (href) {
    return (
      <MotionLink href={href} className={classes} {...HOVER} {...rest}>
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button type={type} className={classes} {...HOVER} {...rest}>
      {children}
    </motion.button>
  );
}
