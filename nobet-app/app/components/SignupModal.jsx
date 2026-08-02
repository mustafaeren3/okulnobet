'use client';

import Link from 'next/link';
import Modal from './Modal';
import SignupForm from '../(auth)/signup/SignupForm';

// LoginModal ile birebir aynı desen: paylaşılan Modal kabuğu (X kapatma,
// ESC, overlay tıklaması, focus tuzağı/yönetimi, responsive — hepsi
// Modal.jsx'te, burada tekrarlanmıyor). Form mantığının TEK kaynağı
// SignupForm (bkz. app/(auth)/signup/SignupForm.jsx) — /signup sayfası
// ile bu modal aynı bileşeni kullanıyor, kod tekrarı yok.
export default function SignupModal({ onClose }) {
  return (
    <Modal onClose={onClose} labelledBy="signup-form-title">
      <div className="auth-modal-body">
        <p className="auth-subtitle">Okulunu ücretsiz kaydet, hemen programını oluştur</p>

        <SignupForm />

        <div className="auth-footer-link">
          Zaten hesabın var mı? <Link href="/login" onClick={onClose}>Giriş yap</Link>
        </div>
      </div>
    </Modal>
  );
}
