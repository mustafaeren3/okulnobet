'use client';

import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { fetchAdmins, grantAdmin, revokeAdmin } from '../../actions/admins';
import Badge from '../../../components/Badge';
import '../../../(wizard)/dashboard/dashboard.css';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Admin ekleme/çıkarma SADECE 'owner' rolündeki bir admin için çalışır —
// RPC seviyesinde (platform_require_owner) zorunlu. 'admin' rolündeki
// biri bu formu doldurursa RPC "owner yetkisi gerekli" hatası döner.
export default function SettingsPage() {
  const [admins, setAdmins] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function refresh() {
    fetchAdmins().then((res) => { if (!res.error) setAdmins(res.admins); });
  }

  useEffect(() => { refresh(); }, []);

  async function handleGrant() {
    if (!email.trim()) return;
    setBusy(true);
    setError('');
    const res = await grantAdmin(email.trim(), role);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setEmail('');
    setNotice('Admin eklendi ✓');
    refresh();
  }

  async function handleRevoke(userId, adminEmail) {
    if (!window.confirm(`${adminEmail} kullanıcısının admin yetkisini kaldırmak istediğine emin misin?`)) return;
    setBusy(true);
    setError('');
    const res = await revokeAdmin(userId);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    refresh();
  }

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="card">
        <h3><Settings size={17} /> Admin Yönetimi</h3>
        <div className="info-box">
          Yeni admin eklemek/çıkarmak sadece "owner" rolündeki bir admin tarafından yapılabilir
          (bkz. platform_require_owner) — bu, admin yetkisinin kimin tarafından genişletilebileceğini
          tek bir yüksek yetkili role bağlar.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: '1 1 220px' }} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={busy} onClick={handleGrant}>Admin Ekle</button>
        </div>
        {error && <div className="holiday-tag" style={{ marginBottom: 12 }}>{error}</div>}
        {notice && <div style={{ color: 'var(--success)', fontSize: 12, marginBottom: 12 }}>{notice}</div>}

        {!admins ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Yükleniyor...</div>
        ) : (
          <table className="distrib-table">
            <thead><tr><th>E-posta</th><th>Rol</th><th>Eklendi</th><th>Durum</th><th></th></tr></thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.user_id}>
                  <td>{a.email}</td>
                  <td>{a.role}</td>
                  <td>{formatDateTime(a.created_at)}</td>
                  <td><Badge variant={a.revoked_at ? 'neutral' : 'success'}>{a.revoked_at ? 'Kaldırıldı' : 'Aktif'}</Badge></td>
                  <td>
                    {!a.revoked_at && (
                      <button className="btn btn-danger" style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }} disabled={busy} onClick={() => handleRevoke(a.user_id, a.email)}>
                        Yetkiyi Kaldır
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
