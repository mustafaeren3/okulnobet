'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { requestPasswordReset, resendPasswordResetCode, verifyResetCode, setNewPassword } from './actions';

// supabase/config.toml [auth.email] max_frequency = "30s" ile birebir aynı
// (bkz. signup/SignupForm.jsx — aynı sabit, aynı gerekçe).
const RESEND_COOLDOWN_SECONDS = 30;

// Akış: e-posta gir → kod doğrula → yeni şifre belirle → (action zaten
// redirect ediyor). SignupForm.jsx'teki faz deseninin aynısı — burada da
// TEK bileşen, üç faz arasında state ile geçiyor.
export default function ForgotPasswordForm() {
  const [phase, setPhase] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (phase !== 'code' || resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase, resendCooldown]);

  async function handleRequestReset(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await requestPasswordReset(email);
    setBusy(false);
    if (res?.error) { setError(res.error); return; }
    setPhase('code');
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendMsg('');
    const res = await resendPasswordResetCode(email);
    setResendMsg(res?.error ? res.error : 'Kod tekrar gönderildi. Gelen kutunda göremezsen spam/gereksiz klasörüne bak.');
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await verifyResetCode({ email, code });
    setBusy(false);
    if (res?.error) { setError(res.error); return; }
    setPhase('newpassword');
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    if (password !== passwordConfirm) { setError('Şifreler eşleşmiyor.'); return; }
    setBusy(true);
    const res = await setNewPassword(password);
    setBusy(false);
    // Başarılıysa action içinde redirect() tetiklenir, buraya dönmez.
    if (res?.error) setError(res.error);
  }

  return (
    <>
      <h1 id="forgot-password-title">
        {phase === 'email' && 'Şifremi Unuttum'}
        {phase === 'code' && 'Kodu Doğrula'}
        {phase === 'newpassword' && 'Yeni Şifre Belirle'}
      </h1>

      {phase === 'email' && (
        <form onSubmit={handleRequestReset} style={{ marginTop: 20 }}>
          <div className="auth-subtitle" style={{ textAlign: 'left', marginBottom: 18 }}>
            Hesabına kayıtlı e-posta adresini gir, sana 6 haneli bir şifre sıfırlama kodu gönderelim.
          </div>
          <div className="auth-field">
            <label htmlFor="forgot-email">E-posta</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@okul.com"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Gönderiliyor...' : 'Sıfırlama Kodu Gönder'}
          </button>
        </form>
      )}

      {phase === 'code' && (
        <form onSubmit={handleVerifyCode} style={{ marginTop: 20 }}>
          <div className="auth-info">
            <strong>{email}</strong> adresine 6 haneli bir şifre sıfırlama kodu gönderdik. Kodu aşağıya gir.
            <br />
            E-posta birkaç dakika içinde gelmezse lütfen <strong>spam / gereksiz</strong> klasörünü kontrol et.
          </div>
          <div className="auth-field">
            <label>Sıfırlama Kodu</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              required
              maxLength={6}
              style={{ textAlign: 'center', fontSize: 20, letterSpacing: 6 }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Doğrulanıyor...' : 'Kodu Doğrula'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            className="btn btn-outline"
            style={{ width: '100%', marginTop: 10 }}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Kodu Tekrar Gönder (${resendCooldown}sn)` : 'Kodu Tekrar Gönder'}
          </button>
          {resendMsg && <div className="auth-subtitle" style={{ marginTop: 10, marginBottom: 0 }}>{resendMsg}</div>}
        </form>
      )}

      {phase === 'newpassword' && (
        <form onSubmit={handleSetPassword} style={{ marginTop: 20 }}>
          <div className="auth-field">
            <label htmlFor="new-password">Yeni Şifre</label>
            <div className="auth-password-wrap">
              <input
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="En az 6 karakter"
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="new-password-confirm">Yeni Şifre (Tekrar)</label>
            <input
              id="new-password-confirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Şifreni tekrar gir"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Kaydediliyor...' : 'Şifreyi Güncelle ve Giriş Yap'}
          </button>
        </form>
      )}

      {error && <div className="auth-error">{error}</div>}

      {phase !== 'newpassword' && (
        <div className="auth-back" style={{ marginTop: 16, textAlign: 'center' }}>
          <Link href="/login">Girişe dön</Link>
        </div>
      )}
    </>
  );
}
