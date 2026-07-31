import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformPurchaseIntents } from '@/lib/db/platformAdmin';
import Link from 'next/link';
import '../../../(wizard)/dashboard/dashboard.css';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default async function PremiumRequestsPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const intents = await getPlatformPurchaseIntents(supabase);

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="card">
        <h3>⬆️ Premium Talepleri ({intents.length})</h3>
        {intents.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz talep yok.</div>
        ) : (
          <table className="distrib-table">
            <thead><tr><th>Okul</th><th>Yetkili</th><th>Telefon</th><th>Not</th><th>Tarih</th></tr></thead>
            <tbody>
              {intents.map((i) => (
                <tr key={i.id}>
                  <td style={{ textAlign: 'left' }}><Link href={`/super-admin/schools/${i.school_id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{i.school_name}</Link></td>
                  <td>{i.contact_name || '—'}</td>
                  <td>{i.contact_phone || '—'}</td>
                  <td>{i.note || '—'}</td>
                  <td>{formatDateTime(i.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
