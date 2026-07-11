'use client';

import { useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [error, setError] = useState('');

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1>Giriş Yap</h1>
      <form
        action={async (formData) => {
          const res = await login(formData);
          if (res?.error) setError(res.error);
        }}
      >
        <input
          name="email"
          type="email"
          placeholder="E-posta"
          required
          style={{ display: 'block', width: '100%', margin: '8px 0', padding: 10, borderRadius: 6, border: '1px solid #2e3350', background: '#1a1d27', color: '#e8ecff' }}
        />
        <input
          name="password"
          type="password"
          placeholder="Şifre"
          required
          style={{ display: 'block', width: '100%', margin: '8px 0', padding: 10, borderRadius: 6, border: '1px solid #2e3350', background: '#1a1d27', color: '#e8ecff' }}
        />
        <button
          type="submit"
          style={{ padding: 10, width: '100%', borderRadius: 6, border: 'none', background: '#4f7ef7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          Giriş Yap
        </button>
      </form>
      {error && <p style={{ color: '#f74f4f' }}>{error}</p>}
      <p style={{ color: '#7a82a8' }}>
        Hesabın yok mu? <a href="/signup" style={{ color: '#4f7ef7' }}>Okulunu kaydet</a>
      </p>
    </main>
  );
}
