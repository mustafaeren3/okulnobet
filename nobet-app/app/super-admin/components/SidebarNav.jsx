'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/super-admin', label: 'Genel Bakış', exact: true },
  { href: '/super-admin/users', label: 'Kullanıcılar' },
  { href: '/super-admin/schools', label: 'Okullar' },
  { href: '/super-admin/subscriptions', label: 'Abonelikler' },
  { href: '/super-admin/payments', label: 'Ödemeler' },
  { href: '/super-admin/premium-requests', label: 'Premium Talepleri' },
  { href: '/super-admin/enterprise-leads', label: 'Kurumsal Talepler' },
  { href: '/super-admin/content', label: 'İçerik Yönetimi' },
  { href: '/super-admin/media', label: 'Medya' },
  { href: '/super-admin/seo', label: 'SEO' },
  { href: '/super-admin/blog', label: 'Blog' },
  { href: '/super-admin/analytics', label: 'Analytics' },
  { href: '/super-admin/system-events', label: 'Sistem Olayları' },
  { href: '/super-admin/audit-logs', label: 'İşlem Geçmişi' },
  { href: '/super-admin/settings', label: 'Ayarlar' },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
