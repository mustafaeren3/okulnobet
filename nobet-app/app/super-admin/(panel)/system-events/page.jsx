import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { getPlatformSystemEvents } from '@/lib/db/systemEvents';
import '../../../(wizard)/dashboard/dashboard.css';

const EVENT_LABELS = {
  login_failed: 'Başarısız giriş',
  login_rate_limited: 'Giriş — rate limit',
  mfa_enroll_failed: 'MFA kurulum — hatalı kod',
  mfa_challenge_failed: 'MFA doğrulama — hatalı kod',
  mfa_rate_limited: 'MFA — rate limit',
  admin_rate_limited: 'Admin panel — rate limit',
};

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default async function SystemEventsPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const events = await getPlatformSystemEvents(supabase, 200);

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="card">
        <h3>🛡️ Sistem Olayları (son 200)</h3>
        <div className="info-box">
          Başarısız giriş denemeleri, MFA hataları ve rate-limit tetiklenmeleri — kişisel veri
          (parola vb.) hiçbir zaman kaydedilmez, sadece e-posta/kullanıcı kimliği ve olay tipi.
        </div>
        {events.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz olay yok.</div>
        ) : (
          <table className="distrib-table">
            <thead><tr><th>Tarih</th><th>Olay</th><th>Detay</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{formatDateTime(e.created_at)}</td>
                  <td>{EVENT_LABELS[e.event_type] || e.event_type}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{e.detail ? JSON.stringify(e.detail) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
