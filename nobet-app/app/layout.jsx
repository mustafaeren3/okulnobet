import { Inter } from 'next/font/google';
import Script from 'next/script';
import PageTransition from './components/PageTransition';
import { createClient } from '@/lib/supabase/server';
import { getSiteContentCached } from '@/lib/db/cms';
import { withDefaults } from '@/lib/data/siteContentDefaults';
import './globals.css';
import './components.css';
// Kök layout'ta: LoginModal/SignupModal (Navbar üzerinden HER route'ta
// açılabiliyor) bu class'lara bağımlı. Next.js CSS'i route segmentine
// göre parçalıyor — sadece /login veya /signup page.jsx'inde import
// edilseydi, modal ana sayfada /login'e hiç gidilmeden açıldığında bu
// stil dosyası henüz yüklenmemiş oluyor (input'lar tarayıcı varsayılanıyla
// çiziliyor), ta ki Next o route'u arka planda prefetch edip getirene
// kadar. Kök layout her sayfada render olduğundan, import da buraya taşındı.
import './(auth)/auth.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

// generateMetadata (async) kullanılıyor — Genel Ayarlar'daki Search
// Console doğrulama kodu DB'den geliyor. ÖNEMLİ: Next.js App Router'da
// <head> elementini layout JSX'ine ELLE eklemek (bir önceki denemede
// yapıldığı gibi) framework'ün kendi head yönetimiyle çakışıp hydration
// hatası veriyor — doğru yol `verification` metadata alanı, bkz. altta.
// Mobil menü artık tam ekran (100dvh) ve safe-area padding kullanıyor —
// viewport-fit=cover olmadan env(safe-area-inset-*) her zaman 0 döner.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export async function generateMetadata() {
  const supabase = createClient();
  const settingsRaw = await getSiteContentCached(supabase, 'global_settings').catch(() => null);
  const settings = withDefaults('global_settings', settingsRaw);
  return {
    metadataBase: new URL('https://okulnobet.com'),
    title: {
      default: `${settings.siteName} — Okullar için Otomatik Nöbet Programı`,
      template: `%s — ${settings.siteName}`,
    },
    description: settings.siteDescription,
    openGraph: {
      title: settings.siteName,
      description: 'Okullar için otomatik nöbet planlama, adil dağıtım, MEB takvimi, tek tıkla PDF çıktısı.',
      images: ['/brand/okulnobet-logo.png'],
      locale: 'tr_TR',
      type: 'website',
    },
    verification: settings.gscVerification ? { google: settings.gscVerification } : undefined,
    // favicon/apple-touch-icon: app/icon.png (Next.js App Router convention) üzerinden
    // otomatik üretiliyor, burada elle belirtmeye gerek yok.
  };
}

// Analytics/etiket ID'leri İçerik Yönetimi → Genel Ayarlar'dan (bkz.
// lib/data/siteContentDefaults.js: global_settings) — script'ler SADECE
// ilgili ID gerçekten girilmişse render edilir, boşsa hiç eklenmez.
export default async function RootLayout({ children }) {
  const supabase = createClient();
  const settingsRaw = await getSiteContentCached(supabase, 'global_settings').catch(() => null);
  const settings = withDefaults('global_settings', settingsRaw);

  return (
    <html lang="tr" className={inter.variable}>
      <body>
        {settings.gtmId && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtmId}');`}
          </Script>
        )}
        {settings.gaId && !settings.gtmId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaId}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.gaId}');`}
            </Script>
          </>
        )}
        {settings.clarityId && (
          <Script id="clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${settings.clarityId}");`}
          </Script>
        )}
        {settings.metaPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.metaPixelId}');fbq('track','PageView');`}
          </Script>
        )}
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
