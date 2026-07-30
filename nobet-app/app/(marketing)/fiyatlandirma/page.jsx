'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PRICING_TIERS, formatTL } from '@/lib/engine/pricing';

const TIER_LABELS = {
  tier_0_20: '0–20 Öğretmen',
  tier_21_40: '21–40 Öğretmen',
  tier_41_60: '41–60 Öğretmen',
  tier_61_plus: '61+ Öğretmen',
};

export default function FiyatlandirmaPage() {
  const [interval, setInterval] = useState('monthly');

  return (
    <main className="mkt-main">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Fiyatlandırma</h1>
        <p>Okulunun öğretmen sayısına göre basit, şeffaf fiyatlandırma. Gizli ücret yok.</p>
      </div>

      <div className="mkt-billing-toggle">
        <button className={interval === 'monthly' ? 'active' : ''} onClick={() => setInterval('monthly')}>Aylık</button>
        <button className={interval === 'yearly' ? 'active' : ''} onClick={() => setInterval('yearly')}>Yıllık</button>
      </div>

      <div className="mkt-pricing-grid">
        {PRICING_TIERS.map((tier, i) => (
          <div key={tier.key} className={`mkt-pricing-card ${i === 1 ? 'mkt-pricing-highlight' : ''}`}>
            <div className="mkt-tier-label">{TIER_LABELS[tier.key]}</div>
            <div className="mkt-price">{formatTL(interval === 'monthly' ? tier.monthly : tier.yearly)}</div>
            <div className="mkt-price-sub">{interval === 'monthly' ? '/ ay' : '/ yıl'}</div>
            <Link href="/signup" className="mkt-btn mkt-btn-primary" style={{ width: '100%' }}>14 Gün Ücretsiz Dene</Link>
          </div>
        ))}
      </div>

      <div className="mkt-section">
        <h2>Tüm Planlarda Neler Var?</h2>
        <div className="mkt-feature-grid">
          <div className="mkt-card">
            <div className="mkt-icon">🔁</div>
            <h4>Otomatik Nöbet Rotasyonu</h4>
            <p>Haftalık veya aylık dönme düzeni — kimin ne zaman nöbete gireceğini elle takip etmene gerek kalmaz.</p>
          </div>
          <div className="mkt-card">
            <div className="mkt-icon">⚖️</div>
            <h4>Kurallara Uygun Atama</h4>
            <p>Branş uyuşmazlığı, gün kısıtı, izinli/raporlu öğretmen gibi kısıtları otomatik uygular.</p>
          </div>
          <div className="mkt-card">
            <div className="mkt-icon">🎌</div>
            <h4>Resmi Tatil Takvimi</h4>
            <p>MEB tatil takvimini tek tuşla yükle, nöbet sırası tatillerde ilerlemez.</p>
          </div>
          <div className="mkt-card">
            <div className="mkt-icon">🖨️</div>
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
