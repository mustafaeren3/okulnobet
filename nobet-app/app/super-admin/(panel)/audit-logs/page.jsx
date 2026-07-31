import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformAuditLogs } from '@/lib/db/platformAdmin';
import Link from 'next/link';
import '../../../(wizard)/dashboard/dashboard.css';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// admin_audit_logs — değiştirilemez/silinemez (bkz. 0022_admin_audit_log.sql).
// Bu sayfa sadece OKUR, hiçbir düzenleme/silme aksiyonu yok (kasıtlı).
export default async function AuditLogsPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const logs = await getPlatformAuditLogs(supabase, { limit: 200 });

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="card">
        <h3>📜 İşlem Geçmişi (son 200 kayıt)</h3>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz kayıt yok.</div>
        ) : (
          <table className="distrib-table">
            <thead><tr><th>Tarih</th><th>İşlem</th><th>Okul</th><th>Neden</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{formatDateTime(l.created_at)}</td>
                  <td>{l.action}</td>
                  <td>
                    {l.school_id ? (
                      <Link href={`/super-admin/schools/${l.school_id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>okula git</Link>
                    ) : '—'}
                  </td>
                  <td>{l.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
