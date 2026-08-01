import { Inter } from 'next/font/google';
import PageTransition from './components/PageTransition';
import './globals.css';
import './components.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://okulnobet.com'),
  title: {
    default: 'OkulNöbet — Okullar için Otomatik Nöbet Programı',
    template: '%s — OkulNöbet',
  },
  description: "Türkiye'deki okullar için otomatik, adil ve kurallara uygun nöbet/görev programı sistemi.",
  openGraph: {
    title: 'OkulNöbet',
    description: 'Okullar için otomatik nöbet planlama, adil dağıtım, MEB takvimi, tek tıkla PDF çıktısı.',
    images: ['/brand/okulnobet-logo.png'],
    locale: 'tr_TR',
    type: 'website',
  },
  // favicon/apple-touch-icon: app/icon.png (Next.js App Router convention) üzerinden
  // otomatik üretiliyor, burada elle belirtmeye gerek yok.
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
