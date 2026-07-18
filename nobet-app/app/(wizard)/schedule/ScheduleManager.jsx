'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getWeekday } from '@/lib/engine/weekday';
import { DAY_TR } from '@/lib/engine/schedule';
import {
  runBulkSchedule,
  fetchScheduleView,
  fetchTeacherOptions,
  addManualAssignment,
  removeAssignment,
} from './actions';
import './schedule.css';

// duty_assignments satırlarını (teachers/duty_zones join'li) tarih ×
// bölge tablosuna indirger. Her hücre, o gün+bölgeye atanmış
// öğretmen(ler)in listesi (id + ad + is_manual) — düzenleme/silme bu
// id'ler üzerinden yapılır.
function buildScheduleTable(rows) {
  const dateSet = new Set();
  const zoneIdByName = new Map();
  const cellMap = {};

  for (const row of rows) {
    const date = row.duty_date;
    const zoneName = row.duty_zones?.name ?? '—';
    dateSet.add(date);
    zoneIdByName.set(zoneName, row.duty_zones?.id);
    cellMap[date] ??= {};
    (cellMap[date][zoneName] ??= []).push({
      id: row.id,
      name: row.teachers?.full_name ?? '—',
      isManual: row.is_manual,
    });
  }

  return {
    dates: [...dateSet].sort(),
    zoneNames: [...zoneIdByName.keys()].sort((a, b) => a.localeCompare(b, 'tr')),
    zoneIdByName,
    cellMap,
  };
}

function ScheduleCell({ date, zoneId, entries, teacherOptions, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleRemove(assignmentId) {
    setBusy(true);
    const res = await removeAssignment(assignmentId);
    setBusy(false);
    if (res.error) { window.alert(res.error); return; }
    onRefresh();
  }

  async function handleAdd() {
    if (!selectedTeacherId) return;
    setBusy(true);
    const res = await addManualAssignment({ teacherId: selectedTeacherId, zoneId, date });
    setBusy(false);
    if (res.error) { window.alert(res.error); return; }
    setAdding(false);
    setSelectedTeacherId('');
    onRefresh();
  }

  return (
    <td>
      <div className="sched-cell">
        {entries.map((e) => (
          <span key={e.id} className="sched-chip">
            {e.name}
            {e.isManual && <span title="Elle düzenlendi (kilitli)"> 🔒</span>}
            <button disabled={busy} onClick={() => handleRemove(e.id)}>×</button>
          </span>
        ))}
        {adding ? (
          <span className="sched-chip-add">
            <select value={selectedTeacherId} onChange={(ev) => setSelectedTeacherId(ev.target.value)}>
              <option value="">Öğretmen seç...</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
            <button disabled={busy || !selectedTeacherId} onClick={handleAdd}>✓</button>
            <button disabled={busy} onClick={() => setAdding(false)}>×</button>
          </span>
        ) : (
          <button className="sched-add-btn" onClick={() => setAdding(true)}>+</button>
        )}
      </div>
    </td>
  );
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
  const [teacherOptions, setTeacherOptions] = useState(null); // null = henüz yüklenmedi

  const table = useMemo(() => buildScheduleTable(rows), [rows]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function loadTeacherOptions() {
    if (teacherOptions) return;
    const res = await fetchTeacherOptions();
    if (!res.error) setTeacherOptions(res.teachers);
  }

  async function refreshView() {
    if (!startDate || !endDate) return;
    const res = await fetchScheduleView(startDate, endDate);
    if (!res.error) setRows(res.rows);
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
    loadTeacherOptions();
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
    loadTeacherOptions();
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
          <div className="sched-info-box">
            💡 Her hücrede öğretmen ekleyip çıkarabilirsin. Elle eklediğin atamalar 🔒 ile
            işaretlenir ve programı yeniden oluşturduğunda silinmez.
          </div>
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
                      <ScheduleCell
                        key={z}
                        date={date}
                        zoneId={table.zoneIdByName.get(z)}
                        entries={table.cellMap[date]?.[z] || []}
                        teacherOptions={teacherOptions || []}
                        onRefresh={refreshView}
                      />
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
