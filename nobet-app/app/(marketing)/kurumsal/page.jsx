'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitEnterpriseLead } from './actions';

export default function KurumsalPage() {
  const [fields, setFields] = useState({ schoolName: '', contactName: '', phone: '', email: '', teacherCountEstimate: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function update(name, value) {
    setFields((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await submitEnterpriseLead(fields);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setSent(true);
  }

  return (
    <main className="mkt-main">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Kurumsal Paket</h1>
        <p>Birden fazla okulu veya ilçe/il müdürlüğünü yönetiyorsan, ihtiyacına özel bir teklif hazırlayalım.</p>
      </div>

      <div className="mkt-section" style={{ maxWidth: 520, margin: '0 auto' }}>
        {sent ? (
          <div className="mkt-card" style={{ textAlign: 'center' }}>
            <h4>Talebiniz alındı ✓</h4>
            <p>Ekibimiz en kısa sürede sizinle iletişime geçecek.</p>
            <Link href="/" className="mkt-btn mkt-btn-outline">Ana Sayfaya Dön</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Okul / Kurum Adı *</label>
              <input required value={fields.schoolName} onChange={(e) => update('schoolName', e.target.value)} />
            </div>
            <div>
              <label>Yetkili Ad Soyad</label>
              <input value={fields.contactName} onChange={(e) => update('contactName', e.target.value)} />
            </div>
            <div>
              <label>Telefon</label>
              <input value={fields.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label>E-posta</label>
              <input type="email" value={fields.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <label>Tahmini Toplam Öğretmen Sayısı</label>
              <input type="number" min="0" value={fields.teacherCountEstimate} onChange={(e) => update('teacherCountEstimate', e.target.value)} />
            </div>
            <div>
              <label>Not</label>
              <textarea rows={3} value={fields.note} onChange={(e) => update('note', e.target.value)} />
            </div>
            {error && <div style={{ color: '#f74f4f', fontSize: 13 }}>{error}</div>}
            <button className="mkt-btn mkt-btn-primary" type="submit" disabled={busy}>{busy ? 'Gönderiliyor...' : 'Teklif Al'}</button>
          </form>
        )}
      </div>
    </main>
  );
}
