import { buildPageMetadata } from '@/lib/seo/metadata';

// page.jsx 'use client' (form state yönetiyor) — metadata export'u
// yalnızca server component'lerde çalışır, bu yüzden bu ince server
// layout'a taşındı (bkz. kurumsal/layout.jsx'teki aynı desen).
export const metadata = buildPageMetadata({
  path: '/signup',
  title: 'Ücretsiz Kayıt Ol',
  description: 'Okulunu ücretsiz kaydet, nöbet programını dakikalar içinde oluştur — kurulum gerektirmez.',
});

export default function SignupLayout({ children }) {
  return children;
}
