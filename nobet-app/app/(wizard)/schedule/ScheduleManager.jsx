'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getWeekday } from '@/lib/engine/weekday';
import { DAY_TR } from '@/lib/engine/schedule';
import { runBulkSchedule, fetchScheduleView } from './actions';
import './schedule.css';

// duty_assignments satırlarını (teachers/duty_zones join'li) tarih ×
// bölge tablosuna indirger.
function buildScheduleTable(rows) {
  const dateSet = new Set();
  const zoneSet = new Set();
  const cellMap = {};

  for (const row of rows) {
    const date = row.duty_date;
    const zoneName = row.duty_zones?.name ?? '—';
    const teacherName = row.teachers?.full_name ?? '—';
    dateSet.add(date);
    zoneSet.add(zoneName);
    cellMap[date] ??= {};
    (cellMap[date][zoneName] ??= []).push(teacherName);
  }

  return {
    dates: [...dateSet].sort(),
    zoneNames: [...zoneSet].sort((a, b) => a.localeCompare(b, 'tr')),
    cellMap,
  };
}

export default function ScheduleManager({ schoolName }) {
  const supabase = createClient();
  const router = useRouter();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [running, setRunning] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [result, setResult] = useState(null); // { createdCount } | { error }
  const [rows, setRows] = useState([]);

  const table = useMemo(() => buildScheduleTable(rows), [rows]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleGenerate() {
    if (!startDate || !endDate) {
      setResult({ error: 'Başlangıç ve bitiş tarihi giriniz.' });
      return;
    }
    if (endDate < startDate) {
      setResult({ error: 'Bitiş tarihi başlangıçtan önce olamaz.' });
      return;
    }

    const confirmed = window.confirm(
      `${startDate} – ${endDate} aralığında yeni bir nöbet programı oluşturulacak.\n\n` +
        'Bu aralıktaki, daha önce OTOMATİK oluşturulmuş tüm atamalar SİLİNİP yeniden üretilecek ' +
        '(elle düzenlediğin atamalara dokunulmayacak).\n\nDevam etmek istiyor musun?'
    );
    if (!confirmed) return;

    setRunning(true);
    setResult(null);
    const res = await runBulkSchedule(startDate, endDate);
    setRunning(false);
    setResult(res);
    setRows(res.rows || []);
  }

  async function handleView() {
    if (!startDate || !endDate) {
      setResult({ error: 'Başlangıç ve bitiş tarihi giriniz.' });
      return;
    }
    if (endDate < startDate) {
      setResult({ error: 'Bitiş tarihi başlangıçtan önce olamaz.' });
      return;
    }

    setViewing(true);
    setResult(null);
    const res = await fetchScheduleView(startDate, endDate);
    setViewing(false);
    if (res.error) { setResult(res); return; }
    setRows(res.rows);
  }

  return (
    <div className="sched-root">
      <header>
        <h1>📅 Program Oluştur</h1>
        <div className="school-name">{schoolName}</div>
        <button className="sched-btn" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={handleLogout}>
          Çıkış Yap
        </button>
      </header>

      <div className="sched-card">
        <h3>Tarih Aralığı</h3>
        <div className="sched-form-row">
          <div>
            <label>Başlangıç</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label>Bitiş</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="sched-warning">
          ⚠️ Bu işlem, seçili aralıktaki <strong>otomatik oluşturulmuş</strong> nöbet atamalarını
          siler ve baştan üretir. Elle düzenlediğin (kilitli) atamalara dokunulmaz. Hafta sonları
          ve resmi tatiller otomatik atlanır.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="sched-btn sched-btn-primary" onClick={handleGenerate} disabled={running || viewing}>
            {running ? 'Oluşturuluyor...' : '✨ Program Oluştur'}
          </button>
          <button className="sched-btn sched-btn-outline" onClick={handleView} disabled={running || viewing}>
            {viewing ? 'Yükleniyor...' : '👁️ Görüntüle'}
          </button>
        </div>

        {result && (
          <div className={`sched-result ${result.error ? 'error' : ''}`}>
            {result.error ? `Hata: ${result.error}` : `✓ ${result.createdCount} nöbet ataması oluşturuldu.`}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="sched-card">
          <h3>Program ({table.dates[0]} – {table.dates[table.dates.length - 1]})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="sched-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Gün</th>
                  {table.zoneNames.map((z) => <th key={z}>{z}</th>)}
                </tr>
              </thead>
              <tbody>
                {table.dates.map((date) => (
                  <tr key={date}>
                    <td>{date}</td>
                    <td>{DAY_TR[getWeekday(date)]}</td>
                    {table.zoneNames.map((z) => (
                      <td key={z}>{(table.cellMap[date]?.[z] || []).join(', ') || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rows.length === 0 && result && !result.error && (
        <div className="sched-card">
          <div className="sched-empty">Bu aralıkta atama bulunamadı.</div>
        </div>
      )}
    </div>
  );
}
