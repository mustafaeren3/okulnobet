import { Wallet, Receipt, CreditCard, Lightbulb } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformPayments, getPlatformSchools } from '@/lib/db/platformAdmin';
import { formatTL } from '@/lib/engine/pricing';
import Link from 'next/link';
import '../../../(wizard)/dashboard/dashboard.css';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Kayıt (record) SADECE okul detay sayfasından yapılır (bkz.
// schools/[id]/SchoolDetailClient.jsx "Ödemeler" sekmesi) — burası tüm
// okullardaki GERÇEK ödeme kayıtlarının salt-okunur listesi.
export default async function PaymentsPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const [payments, schools] = await Promise.all([
    getPlatformPayments(supabase, { limit: 200 }),
    getPlatformSchools(supabase),
  ]);
  const schoolNameById = Object.fromEntries(schools.map((s) => [s.school_id, s.school_name]));
  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon"><Wallet size={20} /></span><div><div className="stat-num">{formatTL(total)}</div><div className="stat-lbl">Toplam Tahsilat (gerçek)</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Receipt size={20} /></span><div><div className="stat-num">{payments.length}</div><div className="stat-lbl">Kayıtlı Ödeme</div></div></div>
      </div>
      <div className="card">
        <h3><CreditCard size={17} /> Ödemeler</h3>
        <div className="info-box"><Lightbulb size={13} /><span>Yeni ödeme kaydı okul detay sayfasındaki &quot;Ödemeler&quot; sekmesinden eklenir.</span></div>
        {payments.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz ödeme kaydı yok.</div>
        ) : (
          <table className="distrib-table">
            <thead><tr><th>Okul</th><th>Tutar</th><th>Yöntem</th><th>Not</th><th>Tarih</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ textAlign: 'left' }}>
                    <Link href={`/super-admin/schools/${p.school_id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      {schoolNameById[p.school_id] || p.school_id}
                    </Link>
                  </td>
                  <td>{formatTL(Number(p.amount))}</td>
                  <td>{p.method || '—'}</td>
                  <td>{p.note || '—'}</td>
                  <td>{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
