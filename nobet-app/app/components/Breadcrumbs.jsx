import Link from 'next/link';
import JsonLd from './JsonLd';
import { breadcrumbSchema } from '@/lib/seo/schema';

// items: [{ name, path }] — "Ana Sayfa" dahil TÜM kırıntılar çağıran
// sayfaca verilir (otomatik eklenmiyor), çünkü görünür liste ile
// BreadcrumbList JSON-LD'nin birebir aynı veriden üretilmesi gerekiyor
// (bkz. schema.js: Google, görünür içerikle uyuşmayan yapılandırılmış
// veriyi yok sayabilir/reddedebilir). Son öğe her zaman mevcut sayfa —
// link almaz, aria-current="page" ile işaretlenir.
export default function Breadcrumbs({ items }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={item.path}>
                {last ? (
                  <span aria-current="page">{item.name}</span>
                ) : (
                  <Link href={item.path}>{item.name}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
