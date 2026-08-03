import { buildPageMetadata } from '@/lib/seo/metadata';

// page.jsx 'use client' (form state yönetiyor) — metadata export'u yalnızca
// server component'lerde çalışır, bu yüzden bu ince server layout'a taşındı.
// Breadcrumbs ise (client component içinden de render edilebildiği için)
// doğrudan page.jsx'in <main>'i içinde, ki gerçekten görünür içeriğin
// parçası olsun.
export const metadata = buildPageMetadata({
  path: '/kurumsal',
  title: 'Kurumsal Paket',
  description: 'Birden fazla okulu veya ilçe/il müdürlüğünü yönetenler için özel teklif — OkulNöbet Kurumsal paketiyle iletişime geçin.',
});

export default function KurumsalLayout({ children }) {
  return children;
}
