import Link from 'next/link';
import { Check, Repeat2, Scale, Flag, Printer } from 'lucide-react';
import { STANDARD_YEARLY_PRICE, formatTL } from '@/lib/engine/pricing';

const FREE_FEATURES = ['Program oluşturabilir', 'İlk ayı görüntüleyebilir', 'Ürünü deneyebilir'];
const STANDARD_FEATURES = [
  'Tüm dönemi görüntüleme', 'Word çıktısı', 'PDF çıktısı', 'Yazdırma',
  'Excel dışa aktarma', 'Programı paylaşma', 'Geçmiş programlar', 'Sınırsız yeniden oluşturma',
];

export default function FiyatlandirmaPage() {
  return (
    <main className="mkt-main">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Fiyatlandırma</h1>
        <p>Basit, şeffaf paketler. Gizli ücret yok.</p>
      </div>

      <div className="mkt-pricing-grid">
        <div className="mkt-pricing-card">
          <div className="mkt-tier-label">Ücretsiz</div>
          <div className="mkt-price">0 ₺</div>
          <div className="mkt-price-sub">her zaman</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', display: 'grid', gap: 8, fontSize: 13, textAlign: 'left' }}>
            {FREE_FEATURES.map((f) => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} color="var(--success)" /> {f}</li>)}
          </ul>
          <Link href="/signup" className="mkt-btn mkt-btn-primary" style={{ width: '100%' }}>Ücretsiz Başla</Link>
        </div>

        <div className="mkt-pricing-card mkt-pricing-highlight">
          <div className="mkt-tier-label">Standart</div>
          <div className="mkt-price">{formatTL(STANDARD_YEARLY_PRICE)}</div>
          <div className="mkt-price-sub">/ yıl</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', display: 'grid', gap: 8, fontSize: 13, textAlign: 'left' }}>
            {STANDARD_FEATURES.map((f) => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} color="var(--success)" /> {f}</li>)}
          </ul>
          <Link href="/signup" className="mkt-btn mkt-btn-primary" style={{ width: '100%' }}>Hemen Satın Al</Link>
        </div>

        <div className="mkt-pricing-card">
          <div className="mkt-tier-label">Kurumsal</div>
          <div className="mkt-price" style={{ fontSize: 22 }}>Teklif Al</div>
          <div className="mkt-price-sub">okul grupları / ilçe-il müdürlükleri</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', display: 'grid', gap: 8, fontSize: 13, textAlign: 'left' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} color="var(--success)" /> Standart&apos;taki her şey</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} color="var(--success)" /> Çoklu okul yönetimi</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} color="var(--success)" /> Özel entegrasyon desteği</li>
          </ul>
          <Link href="/kurumsal" className="mkt-btn mkt-btn-primary" style={{ width: '100%' }}>Teklif Al</Link>
        </div>
      </div>

      <div className="mkt-section">
        <h2>Tüm Planlarda Neler Var?</h2>
        <div className="mkt-feature-grid">
          <div className="mkt-card">
            <div className="mkt-icon"><Repeat2 size={24} /></div>
            <h4>Otomatik Nöbet Rotasyonu</h4>
            <p>Haftalık veya aylık dönme düzeni — kimin ne zaman nöbete gireceğini elle takip etmene gerek kalmaz.</p>
          </div>
          <div className="mkt-card">
            <div className="mkt-icon"><Scale size={24} /></div>
            <h4>Kurallara Uygun Atama</h4>
            <p>Branş uyuşmazlığı, gün kısıtı, izinli/raporlu öğretmen gibi kısıtları otomatik uygular.</p>
          </div>
          <div className="mkt-card">
            <div className="mkt-icon"><Flag size={24} /></div>
            <h4>Resmi Tatil Takvimi</h4>
            <p>MEB tatil takvimini tek tuşla yükle, nöbet sırası tatillerde ilerlemez.</p>
          </div>
          <div className="mkt-card">
            <div className="mkt-icon"><Printer size={24} /></div>
            <h4>Yazdırılabilir Çizelge</h4>
            <p>Resmi evrak formatında, imza bölümlü çıktı al.</p>
          </div>
        </div>
      </div>

      <div className="mkt-section">
        <h2>Merak Ettiklerin mi Var?</h2>
        <p>
          Fiyatlandırmayla ilgili sorularının cevabını <Link href="/sss" style={{ color: 'var(--accent)' }}>Sık Sorulan Sorular</Link> sayfasında bulabilirsin.
        </p>
      </div>
    </main>
  );
}
