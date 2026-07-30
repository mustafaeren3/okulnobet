'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login } from './actions';
import '../auth.css';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="auth-root">
      <div className="auth-card">
        <Link href="/" className="auth-logo">NÖBET SİSTEMİ</Link>
        <div className="auth-subtitle">Okullar için otomatik nöbet programı</div>
        <h1>Giriş Yap</h1>

        <form
          action={async (formData) => {
            setError('');
            setBusy(true);
            const res = await login(formData);
            setBusy(false);
            if (res?.error) setError(res.error);
          }}
        >
          <div className="auth-field">
            <label>E-posta</label>
            <input name="email" type="email" placeholder="ornek@okul.com" required />
          </div>
          <div className="auth-field">
            <label>Şifre</label>
            <input name="password" type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={busy}>
            {busy ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-footer-link">
          Hesabın yok mu? <Link href="/signup">Okulunu kaydet</Link>
        </div>
      </div>
    </div>
  );
}
