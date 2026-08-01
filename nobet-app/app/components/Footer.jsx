import Link from 'next/link';
import { Mail, LifeBuoy } from 'lucide-react';
import Logo from './Logo';
import InstagramIcon from './InstagramIcon';

const FOOTER_LINKS = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/sss', label: 'SSS' },
  { href: '/gizlilik', label: 'KVKK & Gizlilik' },
  { href: '/kullanim-sartlari', label: 'Kullanım Şartları' },
  { href: '/odeme-guvenligi', label: 'Ödeme Güvenliği' },
  { href: '/kurumsal', label: 'İletişim' },
];

export const CONTACT_EMAIL = 'iletisim@okulnobet.com';
export const SUPPORT_EMAIL = 'destek@okulnobet.com';
export const INSTAGRAM_URL = 'https://instagram.com/okulnobet';
export const INSTAGRAM_HANDLE = '@okulnobet';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Logo variant="full" size={56} />
          <p>Türkiye&apos;deki okullar için otomatik, adil ve kurallara uygun nöbet/görev programı sistemi.</p>
          <div className="footer-contact">
            <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={14} /> {CONTACT_EMAIL}</a>
            <a href={`mailto:${SUPPORT_EMAIL}`}><LifeBuoy size={14} /> {SUPPORT_EMAIL}</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><InstagramIcon size={14} /> {INSTAGRAM_HANDLE}</a>
          </div>
        </div>
        <nav className="footer-links">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>
      </div>
      <div className="footer-bottom">© {year} OkulNöbet. Tüm hakları saklıdır.</div>
    </footer>
  );
}
