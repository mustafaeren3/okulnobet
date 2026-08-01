'use client';

import { useState } from 'react';
import Link from 'next/link';
import { startEnrollment, cancelEnrollment, verifyEnrollment, startChallenge, verifyChallenge } from './actions';
import Logo from '../../components/Logo';
import '../../(auth)/auth.css';

// mode='enroll': hiç doğrulanmış TOTP faktörü yok, kurulum (QR + kod)
// gösterilir. mode='challenge': faktör zaten var, sadece kod isteniyor.
export default function MfaScreen({ mode, factorId: initialFactorId }) {
  const [phase, setPhase] = useState(mode === 'enroll' ? 'start' : 'challenge');
  const [factorId, setFactorId] = useState(initialFactorId);
  const [challengeId, setChallengeId] = useState(null);
  const [qrSvg, setQrSvg] = useState(null);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleStartEnrollment() {
    setBusy(true);
    setError('');
    const res = await startEnrollment();
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setFactorId(res.factorId);
    setQrSvg(res.qrSvg);
    setSecret(res.secret);
    setPhase('enroll-verify');
  }

  async function handleCancelEnrollment() {
    if (!factorId) { setPhase('start'); return; }
    setBusy(true);
    await cancelEnrollment(factorId);
    setBusy(false);
    setFactorId(null);
    setQrSvg(null);
    setSecret(null);
    setCode('');
    setError('');
    setPhase('start');
  }

  async function handleVerifyEnrollment(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await verifyEnrollment({ factorId, code });
    setBusy(false);
    if (res?.error) setError(res.error);
    // Başarılıysa action zaten /super-admin'e redirect ediyor.
  }

  async function handleStartChallenge() {
    setBusy(true);
    setError('');
    const res = await startChallenge(factorId);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setChallengeId(res.challengeId);
  }

  async function handleVerifyChallenge(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    let cid = challengeId;
    if (!cid) {
      const res = await startChallenge(factorId);
      if (res.error) { setBusy(false); setError(res.error); return; }
      cid = res.challengeId;
      setChallengeId(cid);
    }
    const res = await verifyChallenge({ factorId, challengeId: cid, code });
    setBusy(false);
    if (res?.error) setError(res.error);
  }

  const qrDataUri = qrSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}` : null;

  return (
    <div className="auth-root">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <Link href="/" className="auth-logo">
          <Logo size={34} />
          <span>OkulNöbet</span>
        </Link>
        <div className="auth-subtitle">Süper Admin — İki Aşamalı Doğrulama</div>
        <h1>{phase === 'challenge' ? 'Kimliğini Doğrula' : 'MFA Kurulumu'}</h1>

        {phase === 'start' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', margin: '12px 0 20px' }}>
              Admin paneline erişmek için bir kimlik doğrulayıcı uygulama
              (Google Authenticator, 1Password, Authy vb.) ile TOTP kurulumu
              tamamlaman gerekiyor.
            </p>
            <button className="auth-btn auth-btn-primary" onClick={handleStartEnrollment} disabled={busy}>
              {busy ? 'Hazırlanıyor...' : 'Kuruluma Başla'}
            </button>
          </>
        )}

        {phase === 'enroll-verify' && (
          <form onSubmit={handleVerifyEnrollment}>
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 12 }}>
              QR kodu kimlik doğrulayıcı uygulamanla tara, sonra üretilen
              6 haneli kodu gir.
            </p>
            {qrDataUri && (
              <div style={{ textAlign: 'center', background: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 }}>
                <img src={qrDataUri} alt="MFA QR kodu" style={{ width: 200, height: 200 }} />
              </div>
            )}
            {secret && (
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 16, wordBreak: 'break-all' }}>
                QR okutamıyorsan elle gir: <code>{secret}</code>
              </div>
            )}
            <div className="auth-field">
              <label>Doğrulama Kodu</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            <button type="submit" className="auth-btn auth-btn-primary" disabled={busy || code.length !== 6}>
              {busy ? 'Doğrulanıyor...' : 'Doğrula ve Etkinleştir'}
            </button>
            <button type="button" className="auth-btn" style={{ marginTop: 8 }} onClick={handleCancelEnrollment} disabled={busy}>
              Vazgeç
            </button>
          </form>
        )}

        {phase === 'challenge' && (
          <form onSubmit={handleVerifyChallenge}>
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 16 }}>
              Kimlik doğrulayıcı uygulamandaki 6 haneli kodu gir.
            </p>
            <div className="auth-field">
              <label>Doğrulama Kodu</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="auth-btn auth-btn-primary" disabled={busy || code.length !== 6}>
              {busy ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>
          </form>
        )}

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-footer-link" style={{ marginTop: 20 }}>
          Kimlik doğrulayıcına erişimini mi kaybettin? Kendi kendine
          sıfırlama yapılamaz (güvenlik gereği) — başka bir "owner" yetkili
          admin ile iletişime geç, seni yeniden yetkilendirsin, ya da
          Supabase proje sahibinden hesabındaki MFA faktörünü temizlemesini
          iste.
        </div>
      </div>
    </div>
  );
}
