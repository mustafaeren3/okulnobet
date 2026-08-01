'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  School, CheckCircle2, Gift, Briefcase, Building2, TrendingUp, DollarSign,
  Wallet, Receipt, UserPlus, Sparkles, Timer, Lightbulb, AlertOctagon, Radio, Flame, ArrowUp,
} from 'lucide-react';
import { formatTL } from '@/lib/engine/pricing';
import { fetchEnterpriseLeads, fetchPurchaseIntents } from '../actions/leads';
import Alert from '../../components/Alert';
import '../../(wizard)/dashboard/dashboard.css';

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

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const EVENT_LABELS = { login_rate_limited: 'Giriş — rate limit', mfa_rate_limited: 'MFA — rate limit', admin_rate_limited: 'Admin panel — rate limit' };

export default function OverviewClient({ schools, metrics, totalCollected, successRate, criticalEvents }) {
  const recentActivity = useMemo(
    () =>
      [...schools]
        .filter((s) => s.last_generated_at)
        .sort((a, b) => new Date(b.last_generated_at) - new Date(a.last_generated_at))
        .slice(0, 8),
    [schools]
  );
  const mostActiveSchools = useMemo(
    () =>
      [...schools]
        .filter((s) => Number(s.generation_count) > 0)
        .sort((a, b) => Number(b.generation_count) - Number(a.generation_count))
        .slice(0, 8),
    [schools]
  );
  const avgGenerationDurationMs = useMemo(() => {
    const withDuration = schools.filter((s) => s.avg_duration_ms !== null && s.avg_duration_ms !== undefined);
    if (!withDuration.length) return 0;
    return withDuration.reduce((sum, s) => sum + Number(s.avg_duration_ms), 0) / withDuration.length;
  }, [schools]);
  const totalGenerationCount = useMemo(
    () => schools.reduce((sum, s) => sum + Number(s.generation_count || 0), 0),
    [schools]
  );

  const [leads, setLeads] = useState(null);
  const [intents, setIntents] = useState(null);
  useEffect(() => {
    fetchEnterpriseLeads().then((res) => { if (!res.error) setLeads(res.leads); });
    fetchPurchaseIntents().then((res) => { if (!res.error) setIntents(res.intents); });
  }, []);

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon"><School size={20} /></span><div><div className="stat-num">{schools.length}</div><div className="stat-lbl">Toplam Okul</div></div></div>
        <div className="stat-card"><span className="stat-icon"><CheckCircle2 size={20} /></span><div><div className="stat-num">{metrics.activeSchoolCount}</div><div className="stat-lbl">Aktif Okul</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Gift size={20} /></span><div><div className="stat-num">{metrics.freeSchoolCount}</div><div className="stat-lbl">Free</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Briefcase size={20} /></span><div><div className="stat-num">{metrics.standardSchoolCount}</div><div className="stat-lbl">Standard</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Building2 size={20} /></span><div><div className="stat-num">{metrics.enterpriseSchoolCount}</div><div className="stat-lbl">Enterprise</div></div></div>
        <div className="stat-card"><span className="stat-icon"><TrendingUp size={20} /></span><div><div className="stat-num">%{Math.round(metrics.conversionRate * 100)}</div><div className="stat-lbl">Premium Dönüşüm Oranı</div></div></div>
        <div className="stat-card"><span className="stat-icon"><DollarSign size={20} /></span><div><div className="stat-num">{formatTL(metrics.estimatedAnnualRevenue)}</div><div className="stat-lbl">ARR (projeksiyon)</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Wallet size={20} /></span><div><div className="stat-num">{formatTL(Math.round(metrics.estimatedMonthlyRevenue))}</div><div className="stat-lbl">Normalize MRR (projeksiyon)</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Receipt size={20} /></span><div><div className="stat-num">{formatTL(totalCollected)}</div><div className="stat-lbl">Toplam Tahsilat (gerçek)</div></div></div>
        <div className="stat-card"><span className="stat-icon"><UserPlus size={20} /></span><div><div className="stat-num">{metrics.newThisWeekCount}</div><div className="stat-lbl">Son 7 Gün Kayıt</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Sparkles size={20} /></span><div><div className="stat-num">{totalGenerationCount}</div><div className="stat-lbl">Oluşturulan Program</div></div></div>
        <div className="stat-card"><span className="stat-icon"><CheckCircle2 size={20} /></span><div><div className="stat-num">{successRate !== null ? `%${successRate}` : '—'}</div><div className="stat-lbl">Program Üretme Başarı Oranı</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Timer size={20} /></span><div><div className="stat-num">{(avgGenerationDurationMs / 1000).toFixed(1)} sn</div><div className="stat-lbl">Ort. Oluşturma Süresi</div></div></div>
      </div>

      <Alert variant="info" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Lightbulb size={13} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          ARR/MRR birer <strong>projeksiyon</strong> (premium okul sayısı × sabit yıllık fiyat). &quot;Toplam Tahsilat&quot; ise
          manuel ödeme kayıtlarının (Ödemeler sayfası) toplamı — GERÇEK veri, tahmin değil. &quot;Program Üretme Başarı
          Oranı&quot; boş kalan yer olmadan tamamlanan üretimlerin oranı.
        </span>
      </Alert>

      {criticalEvents.length > 0 && (
        <div className="card">
          <h3><AlertOctagon size={17} /> Son Kritik Sistem Olayları</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {criticalEvents.map((e) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span>{EVENT_LABELS[e.event_type] || e.event_type}</span>
                <span style={{ color: 'var(--muted)' }}>{formatDateTime(e.created_at)}</span>
              </div>
            ))}
          </div>
          <Link href="/super-admin/system-events" style={{ fontSize: 12, color: 'var(--accent)' }}>Tümünü gör →</Link>
        </div>
      )}

      <div className="card">
        <h3><Radio size={17} /> Canlı Kullanım — Son Program Üretimleri</h3>
        {recentActivity.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz hiçbir okul program üretmedi.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActivity.map((s) => (
              <div key={s.school_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <Link href={`/super-admin/schools/${s.school_id}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>{s.school_name}</Link>
                <span style={{ color: 'var(--muted)' }}>{timeAgo(s.last_generated_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3><Flame size={17} /> En Aktif Okullar (üretim sayısına göre)</h3>
        {mostActiveSchools.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz veri yok.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mostActiveSchools.map((s) => (
              <div key={s.school_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <Link href={`/super-admin/schools/${s.school_id}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>{s.school_name}</Link>
                <span style={{ color: 'var(--muted)' }}>{s.generation_count} üretim</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="two-col">
        <div className="card">
          <h3><Building2 size={17} /> Kurumsal Talepler</h3>
          {!leads ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Yükleniyor...</div>
          ) : leads.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz talep yok.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leads.slice(0, 5).map((l) => (
                <div key={l.id} style={{ fontSize: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{l.school_name}</div>
                  <div style={{ color: 'var(--muted)' }}>{l.contact_name || '—'} · {l.phone || '—'} · {formatDate(l.created_at)}</div>
                </div>
              ))}
            </div>
          )}
          <Link href="/super-admin/enterprise-leads" style={{ fontSize: 12, color: 'var(--accent)' }}>Tümünü gör →</Link>
        </div>
        <div className="card">
          <h3><ArrowUp size={17} /> Premium Talepleri</h3>
          {!intents ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Yükleniyor...</div>
          ) : intents.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz talep yok.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {intents.slice(0, 5).map((i) => (
                <div key={i.id} style={{ fontSize: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{i.school_name}</div>
                  <div style={{ color: 'var(--muted)' }}>{i.contact_name || '—'} · {i.contact_phone || '—'} · {formatDate(i.created_at)}</div>
                </div>
              ))}
            </div>
          )}
          <Link href="/super-admin/premium-requests" style={{ fontSize: 12, color: 'var(--accent)' }}>Tümünü gör →</Link>
        </div>
      </div>
    </div>
  );
}
