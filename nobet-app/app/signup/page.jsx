'use client';

import { useState } from 'react';
import { signUpAndRegisterSchool } from './actions';

const inputStyle = {
  display: 'block',
  width: '100%',
  margin: '8px 0',
  padding: 10,
  borderRadius: 6,
  border: '1px solid #2e3350',
  background: '#1a1d27',
  color: '#e8ecff',
};

export default function SignupPage() {
  const [error, setError] = useState('');

  return (
    <main style={{ maxWidth: 400, margin: '60px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1>Okulunu Kaydet</h1>
      <form
        action={async (formData) => {
          const res = await signUpAndRegisterSchool(formData);
          if (res?.error) setError(res.error);
        }}
      >
        <input name="okulAdi" placeholder="Okul Adı" required style={inputStyle} />
        <input name="il" placeholder="İl" required style={inputStyle} />
        <input name="ilce" placeholder="İlçe" required style={inputStyle} />
        <input name="email" type="email" placeholder="E-posta" required style={inputStyle} />
        <input
          name="password"
          type="password"
          placeholder="Şifre (en az 6 karakter)"
          required
          minLength={6}
          style={inputStyle}
        />
        <button
          type="submit"
          style={{ padding: 10, width: '100%', borderRadius: 6, border: 'none', background: '#4ff7a0', color: '#0f2e1a', fontWeight: 700, cursor: 'pointer' }}
        >
          Kaydol
        </button>
      </form>
      {error && <p style={{ color: '#f74f4f' }}>{error}</p>}
      <p style={{ color: '#7a82a8' }}>
        Zaten hesabın var mı? <a href="/login" style={{ color: '#4f7ef7' }}>Giriş yap</a>
      </p>
    </main>
  );
}
