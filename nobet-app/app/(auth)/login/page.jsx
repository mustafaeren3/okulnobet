import Link from 'next/link';
import LoginForm from '../../components/LoginForm';
import Logo from '../../components/Logo';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata = buildPageMetadata({
  path: '/login',
  title: 'Giriş Yap',
  description: 'OkulNöbet hesabınıza giriş yapın ve okulunuzun nöbet programını yönetin.',
});

export default function LoginPage() {
  return (
    <div className="auth-root">
      <div className="auth-card">
        <Link href="/" className="auth-logo">
          <Logo size={34} />
          <span>OkulNöbet</span>
        </Link>
        <div className="auth-subtitle">Okullar için otomatik nöbet programı</div>
        <h1>Giriş Yap</h1>

        <LoginForm />

        <div className="auth-footer-link">
          Hesabın yok mu? <Link href="/signup">Okulunu kaydet</Link>
        </div>
      </div>
    </div>
  );
}
