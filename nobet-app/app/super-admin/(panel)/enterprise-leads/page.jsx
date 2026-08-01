import { Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformEnterpriseLeads } from '@/lib/db/platformAdmin';
import '../../../(wizard)/dashboard/dashboard.css';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default async function EnterpriseLeadsPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const leads = await getPlatformEnterpriseLeads(supabase);

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="card">
        <h3><Building2 size={17} /> Kurumsal Talepler ({leads.length})</h3>
        {leads.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz talep yok.</div>
        ) : (
          <table className="distrib-table">
            <thead><tr><th>Okul/Kurum</th><th>Yetkili</th><th>Telefon</th><th>E-posta</th><th>Tahmini Öğretmen</th><th>Not</th><th>Tarih</th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td style={{ textAlign: 'left' }}>{l.school_name}</td>
                  <td>{l.contact_name || '—'}</td>
                  <td>{l.phone || '—'}</td>
                  <td>{l.email || '—'}</td>
                  <td>{l.teacher_count_estimate || '—'}</td>
                  <td>{l.note || '—'}</td>
                  <td>{formatDateTime(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
