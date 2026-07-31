import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformSchools } from '@/lib/db/platformAdmin';
import Link from 'next/link';
import '../../../(wizard)/dashboard/dashboard.css';

const STATUS_LABELS = { active: 'Aktif', past_due: 'Ödeme Gecikti', expired: 'Süresi Doldu', cancelled: 'İptal Edildi', frozen: 'Dondurulmuş' };
const PLAN_LABELS = { free: 'Ücretsiz', standard: 'Standart', enterprise: 'Kurumsal' };
// Abonelik sağlığı açısından en acil durumlar üstte — bu sayfa "gözat"
// değil "dikkat gerektirenleri gör" amaçlı (bkz. Okullar sayfası: arama/
// filtre/sayfalama orada).
const STATUS_PRIORITY = { past_due: 0, expired: 1, frozen: 2, active: 3, cancelled: 4 };

export default async function SubscriptionsPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const schools = await getPlatformSchools(supabase);

  const sorted = [...schools].sort(
    (a, b) => (STATUS_PRIORITY[a.subscription_status] ?? 9) - (STATUS_PRIORITY[b.subscription_status] ?? 9)
  );

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="card">
        <h3>💳 Abonelikler</h3>
        <div className="info-box">Dikkat gerektiren durumlar (ödeme gecikti/süresi doldu/dondurulmuş) üstte listelenir. Değişiklik yapmak için okula tıkla.</div>
        <table className="distrib-table">
          <thead><tr><th>Okul</th><th>Plan</th><th>Durum</th><th>Ücretsiz Kota</th></tr></thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.school_id}>
                <td style={{ textAlign: 'left' }}><Link href={`/super-admin/schools/${s.school_id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{s.school_name}</Link></td>
                <td>{PLAN_LABELS[s.plan_type] || s.plan_type || '—'}</td>
                <td>{STATUS_LABELS[s.subscription_status] || s.subscription_status || '—'}</td>
                <td>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
