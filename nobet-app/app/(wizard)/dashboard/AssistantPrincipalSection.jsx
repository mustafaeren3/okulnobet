'use client';

import { useEffect, useState } from 'react';
import { UserCog, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { getWeekday, DAY_TR } from '@/lib/engine/weekday';
import { eachDateStr } from '@/lib/engine/scheduler';
import {
  runAssistantPrincipalSchedule,
  fetchAssistantPrincipalSchedule,
  fetchAssistantPrincipalOptions,
  addManualAssistantPrincipalAssignment,
  removeAssistantPrincipalAssignment,
} from '../assistant-principal-schedule/actions';
import { colorForName, formatDate } from './colorUtils';
import SchedulePopover from './SchedulePopover';

// Program sekmesinde, öğretmen nöbet tablosunun altında AYRI bir bölüm —
// Görevli Müdür Yardımcısı modülü öğretmen nöbetinden tamamen bağımsız
// çalışır (kendi tablosu, kendi verisi), ama aynı görüntülenen tarih
// aralığını paylaşır (kullanıcı isteği). Zone kavramı olmadığı için
// öğretmen tablosundaki grid yerine düz bir tarih listesi yeterli.
export default function AssistantPrincipalSection({ viewedRange, showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState(null);
  const [openDate, setOpenDate] = useState(null);
  const [openMode, setOpenMode] = useState('actions'); // 'actions' | 'picker'
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!viewedRange) { setRows([]); return; }
    let cancelled = false;
    setLoading(true);
    fetchAssistantPrincipalSchedule(viewedRange.start, viewedRange.end).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.error) setRows(res.rows || []);
    });
    return () => { cancelled = true; };
  }, [viewedRange]);

  async function loadOptions() {
    if (options) return options;
    const res = await fetchAssistantPrincipalOptions();
    const list = res.error ? [] : res.people;
    setOptions(list);
    return list;
  }

  async function handleGenerate() {
    if (!viewedRange) return;
    setGenerating(true);
    const res = await runAssistantPrincipalSchedule(viewedRange.start, viewedRange.end);
    setGenerating(false);
    if (res.error) { showToast(res.error, true); return; }
    setRows(res.rows || []);
    showToast('Görevli müdür yardımcısı programı oluşturuldu ✓');
  }

  function rowForDate(date) {
    return rows.find((r) => r.duty_date === date);
  }

  async function handlePick(date, personId) {
    setBusy(true);
    const res = await addManualAssistantPrincipalAssignment({ personId, date });
    setBusy(false);
    setOpenDate(null);
    if (res.error) { showToast(res.error, true); return; }
    setRows((list) => {
      const withoutDate = list.filter((r) => r.duty_date !== date);
      return [...withoutDate, res.row].sort((a, b) => a.duty_date.localeCompare(b.duty_date));
    });
  }

  async function handleRemove(assignmentId, date) {
    setBusy(true);
    const res = await removeAssistantPrincipalAssignment(assignmentId);
    setBusy(false);
    setOpenDate(null);
    if (res.error) { showToast(res.error, true); return; }
    setRows((list) => list.filter((r) => r.duty_date !== date));
  }

  if (!viewedRange) return null;

  // Kalite denetimi düzeltmesi: elle new Date(string) döngüsü yerine
  // projenin var olan, UTC-parse gün kaymasına karşı güvenli yardımcısı
  // (bkz. lib/engine/scheduler.js eachDateStr + lib/engine/weekday.js
  // yorumu) — Dashboard.jsx'teki buildScheduleTable ile AYNI desen.
  const dates = eachDateStr(viewedRange.start, viewedRange.end).filter((d) => {
    const w = getWeekday(d);
    return w >= 1 && w <= 5;
  });

  return (
    <div className="card ap-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}><UserCog size={17} /> Görevli Müdür Yardımcısı</h3>
        <button className="btn btn-outline btn-sm" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Oluşturuluyor...' : <><Sparkles size={13} /> Oluştur</>}
        </button>
      </div>

      {loading ? (
        <div className="info-box">Yükleniyor...</div>
      ) : !dates.length ? (
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Bu aralıkta aktif gün yok.</div>
      ) : (
        <div className="ap-date-grid">
          {dates.map((date) => {
            const row = rowForDate(date);
            const name = row?.assistant_principals?.full_name;
            const color = name ? colorForName(name) : null;
            return (
              <div key={date} className="ap-date-cell-wrap">
                <div className="ap-date-label">{formatDate(date)} · {DAY_TR[getWeekday(date)]}</div>
                {name ? (
                  <button
                    className="ap-person-chip"
                    style={{ background: `#${color}` }}
                    onClick={() => { setOpenDate(date); setOpenMode('actions'); }}
                  >
                    {name}
                  </button>
                ) : (
                  <button
                    className="ap-empty-chip"
                    onClick={async () => { await loadOptions(); setOpenDate(date); setOpenMode('picker'); }}
                  >
                    +
                  </button>
                )}
                {openDate === date && openMode === 'actions' && (
                  <SchedulePopover
                    mode="actions"
                    items={[
                      { key: 'edit', label: 'Değiştir', icon: Pencil },
                      { key: 'remove', label: 'Kaldır', icon: Trash2, danger: true },
                    ]}
                    onSelect={async (item) => {
                      if (item.key === 'remove') { handleRemove(row.id, date); return; }
                      await loadOptions();
                      setOpenMode('picker');
                    }}
                    onClose={() => setOpenDate(null)}
                  />
                )}
                {openDate === date && openMode === 'picker' && (
                  <SchedulePopover
                    mode="picker"
                    items={(options || []).map((p) => ({ key: p.id, label: p.full_name }))}
                    emptyLabel={busy ? 'Kaydediliyor...' : 'Önce Ayarlar sekmesinden görevli müdür yardımcısı ekleyin'}
                    onSelect={(item) => handlePick(date, item.key)}
                    onClose={() => setOpenDate(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
