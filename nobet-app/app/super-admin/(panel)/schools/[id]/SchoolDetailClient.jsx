'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateSubscription, freeze, reopen, cancel, extendTrial, adjustQuota } from '../../../actions/subscriptions';
import { submitSchoolNote } from '../../../actions/schools';
import { submitPayment } from '../../../actions/payments';
import { formatTL } from '@/lib/engine/pricing';
import ConfirmActionModal from '../../../components/ConfirmActionModal';
import Toast from '../../../../components/Toast';
import { useToast } from '../../../../components/useToast';
import '../../../../(wizard)/dashboard/dashboard.css';

const STATUS_LABELS = { active: 'Aktif', past_due: 'Ödeme Gecikti', expired: 'Süresi Doldu', cancelled: 'İptal Edildi', frozen: 'Dondurulmuş' };
const PLAN_LABELS = { free: 'Ücretsiz', standard: 'Standart', enterprise: 'Kurumsal' };
const TABS = ['genel', 'kullanicilar', 'abonelik', 'odemeler', 'program', 'analytics', 'notlar', 'audit'];
const TAB_LABELS = {
  genel: 'Genel Bilgiler', kullanicilar: 'Kullanıcılar', abonelik: 'Abonelik & Kota', odemeler: 'Ödemeler',
  program: 'Program Geçmişi', analytics: 'Kullanım Analytics', notlar: 'Admin Notları', audit: 'Audit Log',
};

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SchoolDetailClient({ schoolId, detail, initialAuditLogs }) {
  const [activeTab, setActiveTab] = useState('genel');
  const { toast, showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // 'freeze' | 'reopen' | 'cancel' | 'quota' | 'payment' | null
  const [auditLogs] = useState(initialAuditLogs || []);
  const [notes, setNotes] = useState(detail.admin_notes || []);
  const [noteText, setNoteText] = useState('');
  const [payments, setPayments] = useState(detail.recent_payments || []);

  const sub = detail.subscription || {};
  const schoolName = detail.school.name;
  const [draft, setDraft] = useState({
    status: sub.status || 'active',
    planType: sub.plan_type || 'free',
    currentPeriodEnd: sub.current_period_end ? sub.current_period_end.slice(0, 16) : '',
  });
  const [extendDays, setExtendDays] = useState('');
  const [newQuota, setNewQuota] = useState(sub.free_generation_quota ?? 1);
  const [paymentDraft, setPaymentDraft] = useState({ amount: '', method: '', note: '' });

  async function handleSaveSubscription() {
    setBusy(true);
    // Plan/durum sabit alan güncellemesi hâlâ "reason zorunlu" DB kuralına
    // tabi — burada basit bir varsayılan neden kullanılıyor; asıl kritik
    // (dondurma/iptal/kota) işlemler ConfirmActionModal ile nedeni kullanıcıdan alıyor.
    const res = await updateSubscription(schoolId, {
      status: draft.status,
      planType: draft.planType,
      trialEndsAt: null,
      currentPeriodEnd: draft.currentPeriodEnd ? new Date(draft.currentPeriodEnd).toISOString() : null,
      reason: 'Admin panelinden manuel güncelleme',
    });
    setBusy(false);
    if (res.error) { showToast(res.error, true); return; }
    showToast('Abonelik güncellendi ✓');
  }

  async function handleExtend() {
    const days = parseInt(extendDays, 10);
    if (!Number.isInteger(days) || days <= 0) { showToast('Geçerli bir gün sayısı girin.', true); return; }
    setBusy(true);
    const res = await extendTrial(schoolId, days, 'Admin panelinden dönem uzatma');
    setBusy(false);
    if (res.error) { showToast(res.error, true); return; }
    setExtendDays('');
    showToast(`${days} gün eklendi ✓`);
  }

  async function handleFreezeConfirm(reason) {
    setBusy(true);
    const res = await freeze(schoolId, reason);
    setBusy(false);
    setModal(null);
    if (res.error) { showToast(res.error, true); return; }
    showToast('Hesap donduruldu');
  }

  async function handleReopenConfirm(reason) {
    setBusy(true);
    const res = await reopen(schoolId, reason);
    setBusy(false);
    setModal(null);
    if (res.error) { showToast(res.error, true); return; }
    showToast('Hesap yeniden açıldı');
  }

  async function handleCancelConfirm(reason) {
    setBusy(true);
    const res = await cancel(schoolId, reason);
    setBusy(false);
    setModal(null);
    if (res.error) { showToast(res.error, true); return; }
    showToast('Abonelik iptal edildi');
  }

  async function handleQuotaConfirm(reason) {
    setBusy(true);
    const res = await adjustQuota(schoolId, parseInt(newQuota, 10), reason);
    setBusy(false);
    setModal(null);
    if (res.error) { showToast(res.error, true); return; }
    showToast('Kota güncellendi ✓');
  }

  async function handlePaymentConfirm(reason) {
    const amount = parseFloat(paymentDraft.amount);
    if (!amount || amount <= 0) { showToast('Geçerli bir tutar girin.', true); return; }
    setBusy(true);
    const res = await submitPayment({ schoolId, amount, method: paymentDraft.method, note: paymentDraft.note, reason });
    setBusy(false);
    setModal(null);
    if (res.error) { showToast(res.error, true); return; }
    setPayments((p) => [{ amount, method: paymentDraft.method, note: paymentDraft.note, created_at: new Date().toISOString() }, ...p]);
    setPaymentDraft({ amount: '', method: '', note: '' });
    showToast('Ödeme kaydedildi ✓');
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setBusy(true);
    const res = await submitSchoolNote(schoolId, noteText.trim());
    setBusy(false);
    if (res.error) { showToast(res.error, true); return; }
    setNotes((n) => [{ note: noteText.trim(), created_at: new Date().toISOString(), admin_email: 'sen' }, ...n]);
    setNoteText('');
  }

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <Link href="/super-admin/schools" style={{ fontSize: 12, color: 'var(--accent)' }}>← Okullara dön</Link>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, margin: '8px 0 4px' }}>{schoolName}</h2>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>{detail.school.city} / {detail.school.district}</div>

      <div className="tabs" style={{ padding: '0 0 0' }}>
        {TABS.map((t) => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[t]}</button>
        ))}
      </div>

      {activeTab === 'genel' && (
        <div className="card">
          <h3>Genel Bilgiler</h3>
          <div style={{ fontSize: 13, display: 'grid', gap: 6 }}>
            <div>Kayıt Tarihi: {formatDateTime(detail.school.created_at)}</div>
            <div>Aktif Öğretmen: {detail.teacher_count}</div>
            <div>Toplam Nöbet: {detail.total_duty_count}</div>
          </div>
        </div>
      )}

      {activeTab === 'kullanicilar' && (
        <div className="card">
          <h3>Kullanıcılar</h3>
          {(detail.users || []).length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Kullanıcı bulunamadı.</div>
          ) : (
            <table className="distrib-table">
              <thead><tr><th>E-posta</th><th>Rol</th><th>Son Giriş</th></tr></thead>
              <tbody>
                {detail.users.map((u) => (
                  <tr key={u.user_id}><td>{u.email}</td><td>{u.role}</td><td>{formatDateTime(u.last_sign_in_at)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'abonelik' && (
        <div className="card">
          <h3>Abonelik & Kota</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <label>Durum</label>
              <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label>Plan</label>
              <select value={draft.planType} onChange={(e) => setDraft((d) => ({ ...d, planType: e.target.value }))}>
                {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label>Dönem Bitişi</label>
              <input type="datetime-local" value={draft.currentPeriodEnd} onChange={(e) => setDraft((d) => ({ ...d, currentPeriodEnd: e.target.value }))} />
            </div>
            <button className="btn btn-primary" style={{ width: 'auto' }} disabled={busy} onClick={handleSaveSubscription}>Plan/Durum Kaydet</button>
          </div>

          <div className="sep" />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <input type="number" min="1" placeholder="gün" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} style={{ width: 80 }} />
            <button className="btn btn-outline" style={{ width: 'auto' }} disabled={busy} onClick={handleExtend}>Bitiş Tarihini Uzat</button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ücretsiz üretim kotası: {sub.free_generation_used ?? 0} / {sub.free_generation_quota ?? 1}</span>
            <input type="number" min="0" value={newQuota} onChange={(e) => setNewQuota(e.target.value)} style={{ width: 70 }} />
            <button className="btn btn-outline" style={{ width: 'auto' }} disabled={busy} onClick={() => setModal('quota')}>Kotayı Artır</button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-danger" style={{ width: 'auto' }} disabled={busy} onClick={() => setModal('freeze')}>Hesabı Dondur</button>
            <button className="btn btn-outline" style={{ width: 'auto' }} disabled={busy} onClick={() => setModal('reopen')}>Hesabı Yeniden Aç</button>
            <button className="btn btn-danger" style={{ width: 'auto' }} disabled={busy} onClick={() => setModal('cancel')}>Aboneliği İptal Et</button>
          </div>
        </div>
      )}

      {activeTab === 'odemeler' && (
        <div className="card">
          <h3>Ödemeler</h3>
          <button className="btn btn-primary" style={{ width: 'auto', marginBottom: 16 }} onClick={() => setModal('payment')}>+ Ödeme Kaydet</button>
          {payments.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz ödeme kaydı yok.</div>
          ) : (
            <table className="distrib-table">
              <thead><tr><th>Tutar</th><th>Yöntem</th><th>Not</th><th>Tarih</th></tr></thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}><td>{formatTL(Number(p.amount))}</td><td>{p.method || '—'}</td><td>{p.note || '—'}</td><td>{formatDateTime(p.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'program' && (
        <div className="card">
          <h3>Program Geçmişi</h3>
          {(detail.recent_generations || []).length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz program üretilmedi.</div>
          ) : (
            <table className="distrib-table">
              <thead><tr><th>Tarih</th><th>Nöbet</th><th>Boş Kalan</th><th>Adalet</th><th>Süre</th></tr></thead>
              <tbody>
                {detail.recent_generations.map((g, i) => (
                  <tr key={i}>
                    <td>{formatDateTime(g.created_at)}</td>
                    <td>{g.created_count}</td>
                    <td>{g.conflict_count}</td>
                    <td>{g.fairness_score}/100</td>
                    <td>{(g.duration_ms / 1000).toFixed(1)} sn</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="card">
          <h3>Kullanım Analytics</h3>
          <div style={{ fontSize: 13, display: 'grid', gap: 6 }}>
            <div>Toplam Nöbet: {detail.total_duty_count}</div>
            <div>Manuel Değişiklik: {detail.manual_change_count}</div>
            <div>Aktif Öğretmen: {detail.teacher_count}</div>
          </div>
        </div>
      )}

      {activeTab === 'notlar' && (
        <div className="card">
          <h3>Admin Notları</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input placeholder="Not ekle..." value={noteText} onChange={(e) => setNoteText(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary" style={{ width: 'auto' }} disabled={busy || !noteText.trim()} onClick={handleAddNote}>Ekle</button>
          </div>
          {notes.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Not yok.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notes.map((n, i) => (
                <div key={i} style={{ fontSize: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <div>{n.note}</div>
                  <div style={{ color: 'var(--muted)' }}>{n.admin_email} · {formatDateTime(n.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card">
          <h3>Audit Log</h3>
          {auditLogs.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Kayıt yok.</div>
          ) : (
            <table className="distrib-table">
              <thead><tr><th>Tarih</th><th>İşlem</th><th>Neden</th></tr></thead>
              <tbody>
                {auditLogs.map((l) => (
                  <tr key={l.id}><td>{formatDateTime(l.created_at)}</td><td>{l.action}</td><td>{l.reason || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Toast toast={toast} />

      {modal === 'freeze' && (
        <ConfirmActionModal
          title="Hesabı Dondur"
          description={`${schoolName} hesabı dondurulacak.`}
          effectSummary="Bu okul dondurulduktan sonra program oluşturamaz, sisteme erişemez. Geri almak için 'Hesabı Yeniden Aç' kullanılır."
          requireTypedConfirmation={schoolName}
          confirmLabel="Dondur"
          danger
          busy={busy}
          onConfirm={handleFreezeConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'reopen' && (
        <ConfirmActionModal
          title="Hesabı Yeniden Aç"
          description={`${schoolName} hesabı 'active' durumuna alınacak.`}
          effectSummary="Okul tekrar program oluşturabilir ve sisteme erişebilir."
          confirmLabel="Yeniden Aç"
          busy={busy}
          onConfirm={handleReopenConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'cancel' && (
        <ConfirmActionModal
          title="Aboneliği İptal Et"
          description={`${schoolName} aboneliği iptal edilecek.`}
          effectSummary="Bu okul artık ücretli özelliklere erişemez (ücretsiz plana benzer kısıtlar geçerli olur)."
          requireTypedConfirmation={schoolName}
          confirmLabel="İptal Et"
          danger
          busy={busy}
          onConfirm={handleCancelConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'quota' && (
        <ConfirmActionModal
          title="Ücretsiz Kotayı Değiştir"
          description={`${schoolName} için ücretsiz üretim kotası ${newQuota} olarak ayarlanacak.`}
          effectSummary={`Şu an kullanılan: ${sub.free_generation_used ?? 0}`}
          confirmLabel="Kaydet"
          busy={busy}
          onConfirm={handleQuotaConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'payment' && (
        <ConfirmActionModal
          title="Ödeme Kaydet"
          description={
            <div style={{ display: 'grid', gap: 8 }}>
              <input type="number" min="0" step="0.01" placeholder="Tutar (TL)" value={paymentDraft.amount} onChange={(e) => setPaymentDraft((d) => ({ ...d, amount: e.target.value }))} />
              <input placeholder="Yöntem (örn. banka havalesi)" value={paymentDraft.method} onChange={(e) => setPaymentDraft((d) => ({ ...d, method: e.target.value }))} />
              <input placeholder="Not" value={paymentDraft.note} onChange={(e) => setPaymentDraft((d) => ({ ...d, note: e.target.value }))} />
            </div>
          }
          confirmLabel="Kaydet"
          busy={busy}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
