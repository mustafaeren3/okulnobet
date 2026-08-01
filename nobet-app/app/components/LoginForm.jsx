'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../(auth)/login/actions';

// /login sayfası ve LoginModal ortak kullanıyor — login server action'ının
// tek çağrı noktası burası. Başarılı girişte action zaten redirect('/dashboard')
// tetikliyor, bu yüzden burada ayrı bir yönlendirme/kapatma mantığı yok.
export default function LoginForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
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
        <label htmlFor="login-email">E-posta</label>
        <input id="login-email" name="email" type="email" placeholder="ornek@okul.com" required />
      </div>
      <div className="auth-field">
        <label htmlFor="login-password">Şifre</label>
        <div className="auth-password-wrap">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
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
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
        {busy ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>

      {error && <div className="auth-error">{error}</div>}
    </form>
  );
}
