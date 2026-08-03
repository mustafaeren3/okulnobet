'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Mail } from 'lucide-react';
import { submitEnterpriseLead } from './actions';
import { CONTACT_EMAIL } from '../../components/contactInfo';
import Breadcrumbs from '../../components/Breadcrumbs';

const BREADCRUMB_ITEMS = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'İletişim', path: '/kurumsal' },
];

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
      <Breadcrumbs items={BREADCRUMB_ITEMS} />
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Kurumsal Paket</h1>
        <p>Birden fazla okulu veya ilçe/il müdürlüğünü yönetiyorsan, ihtiyacına özel bir teklif hazırlayalım.</p>
        <p style={{ marginTop: 8 }}>
          Formu doldurmak istemiyorsan doğrudan yazabilirsin: {' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary-hover)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Mail size={14} /> {CONTACT_EMAIL}
          </a>
        </p>
      </div>

      <div className="mkt-section" style={{ maxWidth: 520, margin: '0 auto' }}>
        {sent ? (
          <div className="mkt-card" style={{ textAlign: 'center' }}>
            <CheckCircle2 size={32} color="var(--success)" style={{ marginBottom: 8 }} />
            <h4>Talebiniz alındı</h4>
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
            {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            <button className="mkt-btn mkt-btn-primary" type="submit" disabled={busy}>{busy ? 'Gönderiliyor...' : 'Teklif Al'}</button>
          </form>
        )}
      </div>
    </main>
  );
}
