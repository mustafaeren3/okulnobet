'use client';

import { useState } from 'react';
import { UserCog, Lightbulb, X } from 'lucide-react';
import {
  addAssistantPrincipal,
  removeAssistantPrincipal,
  updateAssistantPrincipalRotationSettings,
} from '../assistant-principals/actions';

const MODE_LABELS = {
  sequential_daily: 'Her gün sırayla',
  weekly_block: 'Haftalık dönüşüm',
  n_day_block: 'Belirli gün sayısına göre dönüşüm',
};

const MODE_DESCRIPTIONS = {
  sequential_daily: 'Her aktif okul günü listedeki bir sonraki kişiye geçilir (Ali, Ayşe, Ali, Ayşe, ...).',
  weekly_block: 'Bir kişi tüm hafta boyunca görevli kalır, sonraki hafta listede bir sonraki kişiye geçilir.',
  n_day_block: 'Bir kişi belirlediğin sayıda ardışık aktif güne kadar görevli kalır, sonra sıradaki kişiye geçilir.',
};

// Ayarlar sekmesindeki "Görevli Müdür Yardımcısı" kartı: kişi listesi
// (CRUD) + dönüşüm tipi seçimi. Öğretmen nöbetinden tamamen bağımsız bir
// modül olduğu için kendi action dosyalarını kullanır (bkz. app/(wizard)/
// assistant-principals/actions.js) — mevcut öğretmen CRUD'una dokunulmadı.
export default function AssistantPrincipalSettings({ initialPeople, initialSettings, showToast }) {
  const [people, setPeople] = useState(initialPeople || []);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState(initialSettings?.mode || 'sequential_daily');
  const [blockSizeDays, setBlockSizeDays] = useState(initialSettings?.blockSizeDays || 3);
  const [savingSettings, setSavingSettings] = useState(false);

  async function handleAdd() {
    const fullName = name.trim();
    if (!fullName) { showToast('Ad soyad giriniz!', true); return; }
    setSaving(true);
    const res = await addAssistantPrincipal(fullName);
    setSaving(false);
    if (res.error) { showToast(res.error, true); return; }
    setPeople((list) => [...list, res.person]);
    setName('');
    showToast(`${fullName} eklendi`);
  }

  async function handleRemove(person) {
    setPeople((list) => list.filter((p) => p.id !== person.id));
    const res = await removeAssistantPrincipal(person.id);
    if (res.error) {
      setPeople((list) => [...list, person]);
      showToast(res.error, true);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    const res = await updateAssistantPrincipalRotationSettings({ mode, blockSizeDays });
    setSavingSettings(false);
    if (res.error) { showToast(res.error, true); return; }
    showToast('Dönüşüm ayarı kaydedildi ✓');
  }

  return (
    <div className="card">
      <h3><UserCog size={17} /> Görevli Müdür Yardımcısı</h3>
      <div className="info-box">
        Öğretmen nöbetinden bağımsız çalışır — her gün görevli olacak müdür yardımcısını otomatik planlar, Program sekmesinde ayrı bir bölümde gösterilir.
      </div>

      <div className="form-row">
        <div>
          <label>Ad Soyad</label>
          <input type="text" placeholder="AYŞE KAYA" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ alignSelf: 'end' }}>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>+ Ekle</button>
        </div>
      </div>

      <div className="person-list" style={{ marginBottom: 14 }}>
        {people.map((p) => (
          <div className="person-item" key={p.id} style={p.is_active ? undefined : { opacity: 0.5 }}>
            <span className="person-name">{p.full_name}</span>
            <button className="person-del" onClick={() => handleRemove(p)} aria-label="Kaldır"><X size={14} /></button>
          </div>
        ))}
        {!people.length && <div style={{ color: 'var(--muted)', fontSize: 12 }}>Henüz görevli müdür yardımcısı eklenmedi.</div>}
      </div>

      <div className="sep" />

      <label>Dönüşüm Tipi</label>
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        {Object.entries(MODE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {mode === 'n_day_block' && (
        <div style={{ marginTop: 10 }}>
          <label>Gün Sayısı</label>
          <input
            type="number"
            min="1"
            value={blockSizeDays}
            onChange={(e) => setBlockSizeDays(e.target.value)}
          />
        </div>
      )}

      <div className="info-box" style={{ marginTop: 10 }}>
        <Lightbulb size={13} />
        <span>
          {MODE_DESCRIPTIONS[mode]}
          <br /><br />
          Tatil, resmi tatil ve hafta sonlarında sıra İLERLEMEZ, kaldığı yerden devam eder — öğretmen nöbetiyle aynı takvim mantığı.
        </span>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 10, width: '100%' }} onClick={handleSaveSettings} disabled={savingSettings}>
        Dönüşüm Ayarını Kaydet
      </button>
    </div>
  );
}
