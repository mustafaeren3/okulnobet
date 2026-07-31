'use client';

import { useState } from 'react';

// Kritik admin işlemleri için profesyonel onay modalı — window.confirm
// YERİNE (Y4 bulgusu). İşlem nedeni her zaman zorunlu; requireTypedConfirmation
// verilirse (dondurma/iptal gibi yıkıcı işlemlerde) kullanıcı o metni
// birebir yazmadan onaylayamaz.
export default function ConfirmActionModal({
  title,
  description,
  effectSummary,
  requireTypedConfirmation,
  confirmLabel = 'Onayla',
  danger = false,
  onConfirm,
  onCancel,
  busy,
}) {
  const [reason, setReason] = useState('');
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState('');

  const needsTypedMatch = Boolean(requireTypedConfirmation);
  const canSubmit = reason.trim().length > 0 && (!needsTypedMatch || typedName === requireTypedConfirmation);

  async function handleConfirm() {
    if (!canSubmit) { setError('Lütfen işlem nedenini gir' + (needsTypedMatch ? ' ve okul adını tam olarak yaz.' : '.')); return; }
    setError('');
    await onConfirm(reason.trim());
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {description && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{description}</div>}
        {effectSummary && (
          <div
            className="info-box"
            style={danger ? { background: 'rgba(247,79,79,0.1)', borderColor: 'var(--danger)', color: '#ffb3b3' } : undefined}
          >
            {effectSummary}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>İşlem nedeni (zorunlu)</label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Örn: Müşteri banka havalesiyle ödeme yaptı"
            style={{ width: '100%' }}
          />
        </div>

        {needsTypedMatch && (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Devam etmek için okul adını tam olarak yaz: <strong>{requireTypedConfirmation}</strong>
            </label>
            <input value={typedName} onChange={(e) => setTypedName(e.target.value)} style={{ width: '100%' }} />
          </div>
        )}

        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>Vazgeç</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} style={{ flex: 1 }} onClick={handleConfirm} disabled={busy || !canSubmit}>
            {busy ? 'İşleniyor...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
};
const cardStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
  padding: 24, maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto',
};
