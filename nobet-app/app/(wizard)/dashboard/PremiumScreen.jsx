'use client';

import { useState } from 'react';
import { CheckCircle2, Check, Unlock } from 'lucide-react';
import { requestPremiumUpgrade } from '../account/actions';
import { STANDARD_YEARLY_PRICE, formatTL } from '@/lib/engine/pricing';
import Modal from '../../components/Modal';

// Tetikleyen yere göre kısa gerekçe cümlesi — CTA'nın kendisi ve
// yükseltme akışı hep aynı, sadece "neden burdasın" mesajı değişir.
const REASON_MESSAGES = {
  month: 'Bu ay kilitli — ücretsiz planda yalnızca ilk ay görüntülenebilir.',
  export: 'Word/PDF/Excel çıktısı ve yazdırma Premium\'e özel.',
  history: 'Geçmiş programları / özel tarih aralığını görüntülemek Premium\'e özel.',
  share: 'Programı paylaşmak Premium\'e özel.',
  regenerate: 'Ücretsiz planda yalnızca 1 program oluşturabilirsin.',
  yearly: 'Yıllık Dağılım görünümü Premium\'e özel.',
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
    <Modal onClose={onClose} labelledBy="premium-screen-title" maxWidth={420}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={40} color="var(--success)" style={{ marginBottom: 12 }} />
            <h2 id="premium-screen-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Talebiniz alındı</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Ekibimiz en kısa sürede sizinle iletişime geçip Premium hesabınızı aktif edecek.
            </p>
            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={onClose}>Kapat</button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 8 }}><Unlock size={36} color="var(--primary)" /></div>
            <h2 id="premium-screen-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, textAlign: 'center', fontSize: 24 }}>
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
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} color="var(--success)" /> {f}</li>
                ))}
              </ul>
            </div>

            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--primary)' }}>
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
    </Modal>
  );
}
