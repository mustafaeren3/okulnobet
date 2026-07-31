import { createClient } from '@/lib/supabase/server';
import { getPublicSchedule } from '@/lib/db/scheduleShares';

// Girişsiz, herkese açık paylaşım sayfası (Premium özelliği — bkz.
// lib/engine/access.js FEATURES.SHARE_SCHEDULE, PremiumScreen.jsx).
// RLS'i hiçbir tablo üzerinde atlamaz; tek erişim yolu dar kapsamlı
// get_public_schedule SQL fonksiyonu (bkz. 0017_feature_gating.sql).
export default async function PublicSchedulePage({ params }) {
  const supabase = createClient();

  let rows = [];
  let error = null;
  try {
    rows = await getPublicSchedule(supabase, params.token);
  } catch (e) {
    error = e.message;
  }

  if (error || !rows.length) {
    return (
      <main style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif', padding: '0 16px' }}>
        <h1 style={{ fontSize: 20 }}>Bağlantı geçersiz veya süresi dolmuş.</h1>
      </main>
    );
  }

  const schoolName = rows[0].school_name;
  const byDate = new Map();
  for (const r of rows) {
    if (!byDate.has(r.duty_date)) byDate.set(r.duty_date, []);
    byDate.get(r.duty_date).push(r);
  }

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1 style={{ fontSize: 22 }}>{schoolName} — Nöbet Programı</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th style={thStyle}>Tarih</th>
            <th style={thStyle}>Nöbet Yeri</th>
            <th style={thStyle}>Öğretmen</th>
          </tr>
        </thead>
        <tbody>
          {[...byDate.entries()].map(([date, entries]) =>
            entries.map((e, i) => (
              <tr key={`${date}-${i}`}>
                <td style={tdStyle}>{i === 0 ? date : ''}</td>
                <td style={tdStyle}>{e.zone_name}</td>
                <td style={tdStyle}>{e.teacher_name}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}

const thStyle = { textAlign: 'left', borderBottom: '2px solid #ddd', padding: '8px 10px', fontSize: 13 };
const tdStyle = { borderBottom: '1px solid #eee', padding: '8px 10px', fontSize: 13 };
