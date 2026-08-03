'use client';

import Link from 'next/link';
import Modal from './Modal';
import LoginForm from './LoginForm';

export default function LoginModal({ onClose }) {
  return (
    <Modal onClose={onClose} labelledBy="login-modal-title">
      <div className="auth-modal-body">
        <h2 id="login-modal-title">Giriş Yap</h2>
        <p className="auth-subtitle">Okullar için otomatik nöbet programı</p>

        <LoginForm />

        <div className="auth-back" style={{ marginTop: 4, textAlign: 'center' }}>
          <Link href="/forgot-password" onClick={onClose}>Şifremi Unuttum</Link>
        </div>

        <div className="auth-footer-link">
          Hesabın yok mu? <Link href="/signup" onClick={onClose}>Okulunu kaydet</Link>
        </div>
      </div>
    </Modal>
  );
}
