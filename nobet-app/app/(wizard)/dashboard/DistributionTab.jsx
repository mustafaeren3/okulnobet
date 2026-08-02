'use client';

import { useState } from 'react';
import { BarChart3, Trophy, TrendingUp, Percent } from 'lucide-react';
import { fetchYearlyDistribution } from '../schedule/actions';
import { colorForName } from './colorUtils';
import EmptyState from '../../components/EmptyState';

// Dağılım sekmesi: Aylık (mevcut davranış, o an yüklü aralığın basit
// sayımı — Dashboard.jsx'te zaten hesaplanmış `monthlyDistribution`
// prop'u olarak gelir) / Yıllık (okulun ürettiği TÜM ayları birleştiren
// görünüm, bkz. lib/engine/distribution.js + schedule/actions.js
// fetchYearlyDistribution). Yıllık görünüm Premium'e kilitli — ücretsiz
// planın "tek ay" sınırını (Faz 9) dolaşmasın diye.
export default function DistributionTab({ monthlyDistribution, isPremiumClient, onRequestPremium }) {
  const [view, setView] = useState('monthly');
  const [yearly, setYearly] = useState(null);
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [yearlyError, setYearlyError] = useState('');

  async function handleSelectYearly() {
    if (!isPremiumClient) { onRequestPremium(); return; }
    setView('yearly');
    if (yearly || loadingYearly) return;
    setLoadingYearly(true);
    setYearlyError('');
    const res = await fetchYearlyDistribution();
    setLoadingYearly(false);
    if (res.locked) { onRequestPremium(); setView('monthly'); return; }
    if (res.error) { setYearlyError(res.error); return; }
    setYearly(res.distribution);
  }

  const maxMonthlyCount = Math.max(...monthlyDistribution.map((d) => d.count), 1);

  return (
    <div>
      <div className="segmented-control" role="tablist" aria-label="Dağılım görünümü">
        <button
          role="tab"
          aria-selected={view === 'monthly'}
          className={`segmented-btn ${view === 'monthly' ? 'active' : ''}`}
          onClick={() => setView('monthly')}
        >
          Aylık
        </button>
        <button
          role="tab"
          aria-selected={view === 'yearly'}
          className={`segmented-btn ${view === 'yearly' ? 'active' : ''}`}
          onClick={handleSelectYearly}
        >
          Yıllık
        </button>
      </div>

      {view === 'monthly' ? (
        !monthlyDistribution.length ? (
          <EmptyState icon={<BarChart3 size={40} />} title="Program henüz oluşturulmadı" />
        ) : (
          <div className="card">
            <h3><BarChart3 size={17} /> Kişi Başı Nöbet Dağılımı (görüntülenen aralık)</h3>
            <table className="distrib-table">
              <thead>
                <tr><th>Renk</th><th>Ad Soyad</th><th>Nöbet Sayısı</th><th>Dağılım</th></tr>
              </thead>
              <tbody>
                {monthlyDistribution.map((p) => {
                  const pct = Math.round((p.count / maxMonthlyCount) * 100);
                  const color = colorForName(p.name);
                  return (
                    <tr key={p.name}>
                      <td><div className="person-color" style={{ background: `#${color}`, margin: 'auto' }} /></td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{p.count}</td>
                      <td><div className="distrib-bar-wrap"><div className="distrib-bar" style={{ width: `${pct}%`, background: `#${color}` }} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <YearlyDistributionView loading={loadingYearly} error={yearlyError} distribution={yearly} />
      )}
    </div>
  );
}

function YearlyDistributionView({ loading, error, distribution }) {
  if (loading) return <div className="info-box">Yükleniyor...</div>;
  if (error) return <div className="holiday-tag">{error}</div>;
  if (!distribution || !distribution.totalDuties) {
    return <EmptyState icon={<BarChart3 size={40} />} title="Henüz yıllık veri yok" subtitle="Birden fazla ay için program oluşturunca burada görünecek" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon"><BarChart3 size={20} /></span><div><div className="stat-num">{distribution.totalDuties}</div><div className="stat-lbl">Toplam Nöbet</div></div></div>
        <div className="stat-card"><span className="stat-icon"><TrendingUp size={20} /></span><div><div className="stat-num">{distribution.months.length}</div><div className="stat-lbl">Üretilmiş Ay</div></div></div>
        <div className="stat-card"><span className="stat-icon"><Trophy size={20} /></span><div><div className="stat-num">{distribution.perTeacher.length}</div><div className="stat-lbl">Personel</div></div></div>
      </div>

      <div className="card">
        <h3><BarChart3 size={17} /> Öğretmen Bazında Yıllık Dağılım</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {distribution.perTeacher.map((t) => (
            <div key={t.teacherId} className="yearly-teacher-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div className="person-color" style={{ background: `#${colorForName(t.fullName)}` }} />
                <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{t.fullName}</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{t.totalCount}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
                <span className="person-tag" style={{ background: 'var(--border)' }}>
                  <Percent size={10} style={{ verticalAlign: -1 }} /> %{t.percentageShare.toFixed(1)} pay
                </span>
                {t.monthWithMost && (
                  <span className="person-tag" style={{ background: 'var(--border)' }}>
                    <Trophy size={10} style={{ verticalAlign: -1 }} /> En yoğun: {t.monthWithMost.monthLabel} ({t.monthWithMost.count})
                  </span>
                )}
                <span className="person-tag" style={{ background: 'var(--border)' }}>
                  Ort. {t.averagePerActiveMonth.toFixed(1)} / ay
                </span>
              </div>
              {t.monthlyBreakdown.length > 0 && (
                <div className="sparkline-row">
                  {t.monthlyBreakdown.map((m) => {
                    const maxCount = Math.max(...t.monthlyBreakdown.map((x) => x.count), 1);
                    return (
                      <div key={m.monthKey} className="sparkline-bar-wrap" title={`${m.monthLabel}: ${m.count}`}>
                        <div className="sparkline-bar" style={{ height: `${Math.max(8, (m.count / maxCount) * 100)}%` }} />
                        <span className="sparkline-label">{m.monthLabel.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
