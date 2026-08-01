import { Users, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformSchools } from '@/lib/db/platformAdmin';
import '../../../(wizard)/dashboard/dashboard.css';

// Platform sahibinin OKUL BAZLI değil, dağılım/eğilim bazlı görünümü —
// tamamen platform_list_schools()'un GERÇEK verisinden türetilir, yeni
// bir tabloya ihtiyaç yok (bkz. Genel Bakış'taki gibi "uydurma metrik yok" ilkesi).
export default async function AnalyticsPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);
  const schools = await getPlatformSchools(supabase);

  const byCity = {};
  const byPlan = {};
  for (const s of schools) {
    byCity[s.city || 'Bilinmiyor'] = (byCity[s.city || 'Bilinmiyor'] || 0) + 1;
    byPlan[s.plan_type || 'Bilinmiyor'] = (byPlan[s.plan_type || 'Bilinmiyor'] || 0) + 1;
  }
  const cityRows = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const planRows = Object.entries(byPlan).sort((a, b) => b[1] - a[1]);

  const totalTeachers = schools.reduce((sum, s) => sum + Number(s.teacher_count || 0), 0);
  const avgTeachersPerSchool = schools.length ? (totalTeachers / schools.length).toFixed(1) : 0;

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon"><Users size={20} /></span><div><div className="stat-num">{totalTeachers}</div><div className="stat-lbl">Toplam Öğretmen (tüm okullar)</div></div></div>
        <div className="stat-card"><span className="stat-icon"><BarChart3 size={20} /></span><div><div className="stat-num">{avgTeachersPerSchool}</div><div className="stat-lbl">Okul Başına Ort. Öğretmen</div></div></div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Plan Dağılımı</h3>
          <table className="distrib-table">
            <thead><tr><th>Plan</th><th>Okul Sayısı</th></tr></thead>
            <tbody>{planRows.map(([plan, count]) => <tr key={plan}><td>{plan}</td><td>{count}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="card">
          <h3>İl Dağılımı (ilk 15)</h3>
          <table className="distrib-table">
            <thead><tr><th>İl</th><th>Okul Sayısı</th></tr></thead>
            <tbody>{cityRows.map(([city, count]) => <tr key={city}><td>{city}</td><td>{count}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
