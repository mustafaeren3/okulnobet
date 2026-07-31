'use client';

import { useState } from 'react';
import { requestPremiumUpgrade } from '../account/actions';
import { STANDARD_YEARLY_PRICE, formatTL } from '@/lib/engine/pricing';

// Tetikleyen yere göre kısa gerekçe cümlesi — CTA'nın kendisi ve
// yükseltme akışı hep aynı, sadece "neden burdasın" mesajı değişir.
const REASON_MESSAGES = {
  month: 'Bu ay kilitli — ücretsiz planda yalnızca ilk ay görüntülenebilir.',
  export: 'Word/PDF/Excel çıktısı ve yazdırma Premium\'e özel.',
  history: 'Geçmiş programları / özel tarih aralığını görüntülemek Premium\'e özel.',
  share: 'Programı paylaşmak Premium\'e özel.',
  regenerate: 'Ücretsiz planda yalnızca 1 program oluşturabilirsin.',
  account: 'Hesabım sayfasından yükseltme talebi gönderiyorsun.',
};

export default function PremiumScreen({ reason, onClose }) {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSending(true);
    setError('');
    const res = await requestPremiumUpgrade({ contactName, contactPhone });
    setSending(false);
    if (res.error) { setError(res.error); return; }
    if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return; }
    setSent(true);
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <button onClick={onClose} style={closeBtnStyle} aria-label="Kapat">×</button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>Talebiniz alındı</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Ekibimiz en kısa sürede sizinle iletişime geçip Premium hesabınızı aktif edecek.
            </p>
            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={onClose}>Kapat</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🔓</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1, textAlign: 'center', fontSize: 26 }}>
              Tüm dönemi görüntülemeye hazırsınız.
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
              Programınız başarıyla oluşturuldu. İlk ay ücretsiz görüntülenebilir.
            </p>
            {reason && REASON_MESSAGES[reason] && (
              <div className="info-box" style={{ marginTop: 12, fontSize: 13 }}>{REASON_MESSAGES[reason]}</div>
            )}

            <div style={{ margin: '18px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Premium üyelik ile:</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6, fontSize: 13 }}>
                {['Tüm dönem', 'Word çıktısı', 'PDF çıktısı', 'Yazdırma', 'Geçmiş kayıtlar', 'Güncellemeler', 'Öncelikli destek'].map((f) => (
                  <li key={f}>✔ {f}</li>
                ))}
              </ul>
            </div>

            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <div style={{ fontSize: 24, fontFamily: "'Bebas Neue', sans-serif", color: 'var(--accent)' }}>
                {formatTL(STANDARD_YEARLY_PRICE)} <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'inherit' }}>/ yıl</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              <input
                placeholder="Ad Soyad (opsiyonel)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <input
                placeholder="Telefon (opsiyonel)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            {error && <div className="holiday-tag" style={{ marginBottom: 10 }}>{error}</div>}

            <button className="btn btn-success btn-xl" style={{ width: '100%' }} onClick={handleSubmit} disabled={sending}>
              {sending ? 'Gönderiliyor...' : 'Premium\'a Geç'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
};
const cardStyle = {
  position: 'relative', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 12, padding: 28, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto',
};
const closeBtnStyle = {
  position: 'absolute', top: 10, right: 10, background: 'none', border: 'none',
  fontSize: 22, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1,
};
