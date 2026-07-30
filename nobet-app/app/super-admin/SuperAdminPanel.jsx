'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { extendTrial, updateSubscription, freeze, fetchPlatformSchools } from './actions';
import { computePlatformMetrics } from '@/lib/engine/platformMetrics';
import { getSubscriptionStatus } from '@/lib/engine/subscription';
import { formatTL } from '@/lib/engine/pricing';
import '../(wizard)/dashboard/dashboard.css';

const STATUS_LABELS = {
  trialing: 'Deneme',
  active: 'Aktif',
  expired: 'Süresi Doldu',
  canceled: 'İptal Edildi',
  frozen: 'Dondurulmuş',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function timeAgo(dateStr, now = new Date()) {
  if (!dateStr) return 'hiç üretilmedi';
  const ms = now.getTime() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

// datetime-local input <-> ISO string dönüşümü.
function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SuperAdminPanel({ initialSchools }) {
  const [schools, setSchools] = useState(initialSchools);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [busySchoolId, setBusySchoolId] = useState(null);
  const [expandedSchoolId, setExpandedSchoolId] = useState(null);
  const [draft, setDraft] = useState({ status: '', planType: '', trialEndsAt: '', currentPeriodEnd: '' });
  const [extendDays, setExtendDays] = useState({});

  function showToast(message, isError = false) {
    setToast({ message, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  async function refresh() {
    const res = await fetchPlatformSchools();
    if (res.error) { showToast(res.error, true); return; }
    setSchools(res.schools);
  }

  const metrics = useMemo(() => computePlatformMetrics(schools), [schools]);

  const recentActivity = useMemo(
    () =>
      [...schools]
        .filter((s) => s.last_generated_at)
        .sort((a, b) => new Date(b.last_generated_at) - new Date(a.last_generated_at))
        .slice(0, 8),
    [schools]
  );

  function openSubscriptionEditor(school) {
    if (expandedSchoolId === school.school_id) { setExpandedSchoolId(null); return; }
    setExpandedSchoolId(school.school_id);
    setDraft({
      status: school.subscription_status || 'trialing',
      planType: school.plan_type || 'trial',
      trialEndsAt: toDatetimeLocal(school.trial_ends_at),
      currentPeriodEnd: toDatetimeLocal(school.current_period_end),
    });
  }

  async function handleExtendTrial(school) {
    const days = parseInt(extendDays[school.school_id], 10);
    if (!Number.isInteger(days) || days <= 0) { showToast('Geçerli bir gün sayısı girin.', true); return; }
    setBusySchoolId(school.school_id);
    const res = await extendTrial(school.school_id, days);
    setBusySchoolId(null);
    if (res.error) { showToast(res.error, true); return; }
    setExtendDays((d) => ({ ...d, [school.school_id]: '' }));
    showToast(`${school.school_name}: deneme süresi ${days} gün uzatıldı ✓`);
    refresh();
  }

  async function handleSaveSubscription(school) {
    setBusySchoolId(school.school_id);
    const res = await updateSubscription(school.school_id, {
      status: draft.status,
      planType: draft.planType,
      trialEndsAt: draft.trialEndsAt ? new Date(draft.trialEndsAt).toISOString() : null,
      currentPeriodEnd: draft.currentPeriodEnd ? new Date(draft.currentPeriodEnd).toISOString() : null,
    });
    setBusySchoolId(null);
    if (res.error) { showToast(res.error, true); return; }
    showToast(`${school.school_name}: abonelik güncellendi ✓`);
    setExpandedSchoolId(null);
    refresh();
  }

  async function handleFreeze(school) {
    if (!window.confirm(`${school.school_name} hesabını dondurmak istediğine emin misin? Okul artık program oluşturamaz/kullanamaz.`)) return;
    setBusySchoolId(school.school_id);
    const res = await freeze(school.school_id);
    setBusySchoolId(null);
    if (res.error) { showToast(res.error, true); return; }
    showToast(`${school.school_name}: hesap donduruldu`);
    refresh();
  }

  return (
    <div className="dash-root">
      <header>
        <div className="logo">NÖBET SİSTEMİ</div>
        <div className="badge">SÜPER ADMIN</div>
        <Link href="/dashboard" className="school-name" style={{ textDecoration: 'none' }}>← Kendi panelime dön</Link>
      </header>

      <div style={{ padding: '24px 32px' }}>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🏫</span>
            <div><div className="stat-num">{metrics.activeSchoolCount}</div><div className="stat-lbl">Aktif Okul</div></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div><div className="stat-num">{formatTL(metrics.estimatedMonthlyRevenue)}</div><div className="stat-lbl">Aylık Tahmini Ciro</div></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🆕</span>
            <div><div className="stat-num">{metrics.newThisWeekCount}</div><div className="stat-lbl">Bu Hafta Kaydolan</div></div>
          </div>
        </div>

        <div className="card">
          <h3>📡 Canlı Kullanım — Son Program Üretimleri</h3>
          {recentActivity.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz hiçbir okul program üretmedi.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentActivity.map((s) => (
                <div key={s.school_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span>{s.school_name}</span>
                  <span style={{ color: 'var(--muted)' }}>{timeAgo(s.last_generated_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>🏫 Okullar ({schools.length})</h3>
          <div className="schedule-wrapper" style={{ overflowX: 'auto' }}>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Okul</th>
                  <th>Öğretmen</th>
                  <th>Durum</th>
                  <th>Deneme/Dönem Bitişi</th>
                  <th>Son Üretim</th>
                  <th>Kayıt</th>
                  <th>Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => {
                  const status = getSubscriptionStatus({
                    status: s.subscription_status,
                    trialEndsAt: s.trial_ends_at,
                    currentPeriodEnd: s.current_period_end,
                  });
                  const busy = busySchoolId === s.school_id;
                  return (
                    <Fragment key={s.school_id}>
                      <tr>
                        <td style={{ textAlign: 'left' }}>
                          {s.school_name}
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.city} / {s.district}</div>
                        </td>
                        <td>{s.teacher_count}</td>
                        <td>
                          <span
                            className="person-tag"
                            style={{
                              background: status.isUsable ? 'var(--success)' : 'var(--danger)',
                              color: status.isUsable ? '#0f2e1a' : '#fff',
                            }}
                          >
                            {STATUS_LABELS[s.subscription_status] || s.subscription_status || '—'}
                          </span>
                        </td>
                        <td>{formatDate(s.subscription_status === 'active' ? s.current_period_end : s.trial_ends_at)}</td>
                        <td>{timeAgo(s.last_generated_at)}</td>
                        <td>{formatDate(s.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              placeholder="gün"
                              value={extendDays[s.school_id] || ''}
                              onChange={(e) => setExtendDays((d) => ({ ...d, [s.school_id]: e.target.value }))}
                              style={{ width: 60, padding: '4px 6px' }}
                            />
                            <button className="btn btn-outline" style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }} disabled={busy} onClick={() => handleExtendTrial(s)}>
                              Deneme Uzat
                            </button>
                            <button className="btn btn-outline" style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }} disabled={busy} onClick={() => openSubscriptionEditor(s)}>
                              {expandedSchoolId === s.school_id ? 'Kapat' : 'Abonelik Düzenle'}
                            </button>
                            <button className="btn btn-danger" style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }} disabled={busy} onClick={() => handleFreeze(s)}>
                              Dondur
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedSchoolId === s.school_id && (
                        <tr>
                          <td colSpan={7} style={{ background: 'var(--surface2)', textAlign: 'left', padding: 16 }}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div>
                                <label>Durum</label>
                                <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
                                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label>Plan</label>
                                <select value={draft.planType} onChange={(e) => setDraft((d) => ({ ...d, planType: e.target.value }))}>
                                  <option value="trial">Deneme</option>
                                  <option value="standard">Standart (Ödemeli)</option>
                                </select>
                              </div>
                              <div>
                                <label>Deneme Bitişi</label>
                                <input
                                  type="datetime-local"
                                  value={draft.trialEndsAt}
                                  onChange={(e) => setDraft((d) => ({ ...d, trialEndsAt: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label>Dönem Bitişi</label>
                                <input
                                  type="datetime-local"
                                  value={draft.currentPeriodEnd}
                                  onChange={(e) => setDraft((d) => ({ ...d, currentPeriodEnd: e.target.value }))}
                                />
                              </div>
                              <button className="btn btn-primary" style={{ width: 'auto' }} disabled={busy} onClick={() => handleSaveSubscription(s)}>
                                Kaydet
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
            background: toast.isError ? 'var(--danger)' : 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '12px 18px',
            color: '#fff', fontSize: 13, maxWidth: 360,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
