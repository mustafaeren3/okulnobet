import { Settings, Calendar, BarChart3, Calendar as CalendarIcon, Users, School, CheckCircle2 } from 'lucide-react';

const TABS = [
  { key: 'ayarlar', label: 'Ayarlar', icon: Settings },
  { key: 'program', label: 'Program', icon: Calendar, active: true },
  { key: 'dagitim', label: 'Dağılım', icon: BarChart3 },
];

const STATS = [
  { icon: CalendarIcon, num: '22', label: 'Aktif Gün' },
  { icon: Users, num: '18', label: 'Personel' },
  { icon: School, num: '6', label: 'Nöbet Yeri' },
  { icon: CheckCircle2, num: '132', label: 'Toplam Nöbet' },
];

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
const ROWS = [
  ['A. Yılmaz', 'B. Kaya', '', 'C. Demir', 'A. Yılmaz'],
  ['', 'B. Kaya', 'D. Şahin', 'E. Aydın', 'C. Demir'],
  ['D. Şahin', 'E. Aydın', 'A. Yılmaz', 'B. Kaya', ''],
];

// Gerçek Dashboard'ın görsel dilini (tab bar, stat kartları, nöbet tablosu)
// birebir kopyalayan büyük, statik ürün önizlemesi — gerçek ekran görüntüsü
// değil, tasarım varlığı olmadığı için CSS/JSX ile inşa edildi.
export default function DashboardDemo() {
  return (
    <div className="demo-window" aria-hidden="true">
      <div className="demo-titlebar">
        <span className="demo-dot" style={{ background: 'var(--danger)' }} />
        <span className="demo-dot" style={{ background: 'var(--warning)' }} />
        <span className="demo-dot" style={{ background: 'var(--success)' }} />
        <span className="demo-url">app.okulnobet.com/dashboard</span>
        <span className="demo-live"><span className="demo-live-dot" /> Canlı</span>
      </div>

      <div className="demo-tabs">
        {TABS.map((t) => (
          <span key={t.key} className={`demo-tab ${t.active ? 'active' : ''}`}>
            <t.icon size={14} /> {t.label}
          </span>
        ))}
      </div>

      <div className="demo-body">
        <div className="demo-stats">
          {STATS.map((s) => (
            <div key={s.label} className="demo-stat">
              <s.icon size={16} />
              <div>
                <div className="demo-stat-num">{s.num}</div>
                <div className="demo-stat-lbl">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="demo-table">
          <div className="demo-table-row demo-table-head">
            {DAYS.map((d) => <span key={d}>{d}</span>)}
          </div>
          {ROWS.map((row, ri) => (
            <div key={ri} className="demo-table-row">
              {row.map((cell, ci) => (
                <span key={ci} className={`demo-cell ${cell ? 'filled' : ''}`}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
