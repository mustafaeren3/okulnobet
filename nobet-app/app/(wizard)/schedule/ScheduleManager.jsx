'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { runBulkSchedule } from './actions';
import './schedule.css';

export default function ScheduleManager({ schoolName }) {
  const supabase = createClient();
  const router = useRouter();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null); // { createdCount } | { error }

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

        <button className="sched-btn sched-btn-primary" onClick={handleGenerate} disabled={running}>
          {running ? 'Oluşturuluyor...' : '✨ Program Oluştur'}
        </button>

        {result && (
          <div className={`sched-result ${result.error ? 'error' : ''}`}>
            {result.error ? `Hata: ${result.error}` : `✓ ${result.createdCount} nöbet ataması oluşturuldu.`}
          </div>
        )}
      </div>
    </div>
  );
}
