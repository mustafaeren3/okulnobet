import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PRICING_TIERS, formatTL } from '@/lib/engine/pricing';
import './(marketing)/marketing.css';

// Kök `/` route'u — (marketing) route group'un DIŞINDA (parantezli
// gruplar URL'e eklenmiyor, aynı route group içine ikinci bir page.jsx
// koymak `/` için çakışma yaratır). Bu yüzden header/footer burada
// ayrıca tutuluyor, (marketing)/layout.jsx'teki ile aynı görünüm.

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="mkt-root">
      <header className="mkt-header">
        <span className="mkt-logo">NÖBET SİSTEMİ</span>
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

      <main className="mkt-main">
        <div className="mkt-hero">
          <h1>Nöbet Programını<br />Dakikalar İçinde Oluştur</h1>
          <p>
            Türkiye'deki okullar için otomatik, adil ve kurallara uygun nöbet/görev programı sistemi.
            Öğretmenlerini ve nöbet bölgelerini tanımla, gerisini sisteme bırak.
          </p>
          <div className="mkt-hero-actions">
            <Link href="/signup" className="mkt-btn mkt-btn-primary mkt-btn-lg">14 Gün Ücretsiz Dene</Link>
            <Link href="/fiyatlandirma" className="mkt-btn mkt-btn-outline mkt-btn-lg">Fiyatlandırmayı Gör</Link>
          </div>
        </div>

        <div className="mkt-section">
          <h2>Neden Nöbet Sistemi?</h2>
          <div className="mkt-feature-grid">
            <div className="mkt-card">
              <div className="mkt-icon">🔁</div>
              <h4>Otomatik Rotasyon</h4>
              <p>Haftalık veya aylık dönme düzeni ile her öğretmen sırayla, adil şekilde nöbet tutar.</p>
            </div>
            <div className="mkt-card">
              <div className="mkt-icon">⚖️</div>
              <h4>Kurallara Uygun</h4>
              <p>Branş, gün kısıtı, izin/rapor ve çift nöbet kuralları otomatik uygulanır.</p>
            </div>
            <div className="mkt-card">
              <div className="mkt-icon">🎌</div>
              <h4>MEB Tatil Takvimi</h4>
              <p>Resmi tatiller tek tuşla yüklenir, nöbet sırası tatillerde ilerlemez.</p>
            </div>
            <div className="mkt-card">
              <div className="mkt-icon">🖨️</div>
              <h4>Resmi Evrak Çıktısı</h4>
              <p>İmza bölümlü, yazdırmaya hazır nöbet çizelgesi oluştur.</p>
            </div>
          </div>
        </div>

        <div className="mkt-section">
          <h2>Öğretmen Sayına Göre Fiyatlandırma</h2>
          <div className="mkt-pricing-grid">
            {PRICING_TIERS.map((tier, i) => (
              <div key={tier.key} className={`mkt-pricing-card ${i === 1 ? 'mkt-pricing-highlight' : ''}`}>
                <div className="mkt-price">{formatTL(tier.monthly)}</div>
                <div className="mkt-price-sub">/ ay</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/fiyatlandirma" className="mkt-btn mkt-btn-outline">Tüm Planları ve Yıllık Fiyatları Gör</Link>
          </div>
        </div>
      </main>

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
