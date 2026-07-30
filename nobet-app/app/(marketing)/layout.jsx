import Link from 'next/link';
import './marketing.css';

// Genel (giriş gerektirmeyen) tanıtım sayfalarının ortak header/footer'ı.
// Ana sayfa (app/page.jsx) BURAYA dahil değil — kök `/` route'u zaten
// var, aynı route group'ta ikinci bir page.jsx route çakışması yaratır;
// ana sayfa kendi başlık/altbilgisini ayrıca taşıyor (bkz. o dosya).

export const metadata = {
  title: 'Nöbet Sistemi — Okullar için Otomatik Nöbet Programı',
  description: 'Türkiye\'deki okullar için adil, kurallara uygun ve otomatik nöbet/görev programı oluşturma sistemi.',
};

export default function MarketingLayout({ children }) {
  return (
    <div className="mkt-root">
      <header className="mkt-header">
        <Link href="/" className="mkt-logo">NÖBET SİSTEMİ</Link>
        <nav className="mkt-nav">
          <Link href="/fiyatlandirma">Fiyatlandırma</Link>
          <Link href="/hakkimizda">Hakkımızda</Link>
          <Link href="/sss">Sık Sorulan Sorular</Link>
        </nav>
        <div className="mkt-header-actions">
          <Link href="/login" className="mkt-btn mkt-btn-outline">Giriş Yap</Link>
          <Link href="/signup" className="mkt-btn mkt-btn-primary">Okulunu Kaydet</Link>
        </div>
      </header>

      {children}

      <footer className="mkt-footer">
        <div>© {new Date().getFullYear()} Nöbet Sistemi. Tüm hakları saklıdır.</div>
        <nav>
          <Link href="/hakkimizda">Hakkımızda</Link>
          <Link href="/sss">SSS</Link>
          <Link href="/gizlilik">Gizlilik Politikası</Link>
          <Link href="/kullanim-sartlari">Kullanım Şartları</Link>
          <Link href="/odeme-guvenligi">Ödeme Güvenliği</Link>
        </nav>
      </footer>
    </div>
  );
}
