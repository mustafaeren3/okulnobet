'use client';

import Link from 'next/link';
import SignupForm from './SignupForm';
import Logo from '../../components/Logo';

export default function SignupPage() {
  return (
    <div className="auth-root">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <Link href="/" className="auth-logo">
          <Logo size={34} />
          <span>OkulNöbet</span>
        </Link>
        <div className="auth-subtitle">Okulunu ücretsiz kaydet, hemen programını oluştur</div>

        <SignupForm />

        <div className="auth-footer-link">
          Zaten hesabın var mı? <Link href="/login">Giriş yap</Link>
        </div>
      </div>
    </div>
  );
}
