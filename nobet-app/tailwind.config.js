// Tailwind sadece /super-admin rotasına izole — content taraması SADECE
// bu klasörü kapsıyor, ana uygulama (dashboard/signup/landing) hiç
// etkilenmiyor. Renkler yeni bir token seti İCAT ETMİYOR — app/globals.css'teki
// MEVCUT CSS değişkenlerine (--bg, --card, --border, --text, --primary...)
// doğrudan işaret ediyor, böylece super-admin paneli görsel olarak
// birebir aynı (kalıcı koyu tema) kalıyor, ayrı bir tema sistemi olmuyor.
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./app/super-admin/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        border: 'var(--border)',
        foreground: 'var(--text)',
        muted: 'var(--text-muted)',
        'muted-foreground': 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          foreground: '#ffffff',
        },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: '#ffffff',
        },
        input: 'var(--border)',
        ring: 'var(--primary)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        DEFAULT: 'var(--radius-md)',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
