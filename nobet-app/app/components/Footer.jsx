import Link from 'next/link';
import { Mail, LifeBuoy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSiteContent } from '@/lib/db/cms';
import { withDefaults } from '@/lib/data/siteContentDefaults';
import Logo from './Logo';
import InstagramIcon from './InstagramIcon';

const FOOTER_LINKS = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/sss', label: 'SSS' },
  { href: '/blog', label: 'Blog' },
  { href: '/gizlilik', label: 'KVKK & Gizlilik' },
  { href: '/kullanim-sartlari', label: 'Kullanım Şartları' },
  { href: '/cerez-politikasi', label: 'Çerez Politikası' },
  { href: '/odeme-guvenligi', label: 'Ödeme Güvenliği' },
  { href: '/kurumsal', label: 'İletişim' },
];

// Server Component (async) — footer TÜM sayfalarda göründüğü için
// içeriği burada kendi başına çekiyor, her sayfanın ayrı ayrı prop
// geçmesi gerekmiyor.
export default async function Footer() {
  const year = new Date().getFullYear();
  const supabase = createClient();
  const [footerRaw, contactRaw, socialRaw] = await Promise.all([
    getSiteContent(supabase, 'footer').catch(() => null),
    getSiteContent(supabase, 'contact').catch(() => null),
    getSiteContent(supabase, 'social').catch(() => null),
  ]);
  const footer = withDefaults('footer', footerRaw);
  const contact = withDefaults('contact', contactRaw);
  const social = withDefaults('social', socialRaw);

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Logo variant="full" size={56} />
          <p>{footer.description}</p>
          <div className="footer-contact">
            <a href={`mailto:${contact.email}`}><Mail size={14} /> {contact.email}</a>
            <a href={`mailto:${contact.supportEmail}`}><LifeBuoy size={14} /> {contact.supportEmail}</a>
            <a href={social.instagramUrl} target="_blank" rel="noopener noreferrer"><InstagramIcon size={14} /> {social.instagramHandle}</a>
          </div>
        </div>
        <nav className="footer-links">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>
      </div>
      <div className="footer-bottom">© {year} {footer.copyrightName}. Tüm hakları saklıdır.</div>
    </footer>
  );
}
