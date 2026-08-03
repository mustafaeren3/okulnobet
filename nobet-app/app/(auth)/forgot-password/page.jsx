import Link from 'next/link';
import ForgotPasswordForm from './ForgotPasswordForm';
import Logo from '../../components/Logo';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata = buildPageMetadata({
  path: '/forgot-password',
  title: 'Şifremi Unuttum',
  description: 'OkulNöbet hesabının şifresini e-posta ile gönderilen kodla sıfırla.',
});

export default function ForgotPasswordPage() {
  return (
    <div className="auth-root">
      <div className="auth-card">
        <Link href="/" className="auth-logo">
          <Logo size={34} />
          <span>OkulNöbet</span>
        </Link>
        <div className="auth-subtitle">Okullar için otomatik nöbet programı</div>

        <ForgotPasswordForm />

        <div className="auth-footer-link">
          Hesabın yok mu? <Link href="/signup">Okulunu kaydet</Link>
        </div>
      </div>
    </div>
  );
}
