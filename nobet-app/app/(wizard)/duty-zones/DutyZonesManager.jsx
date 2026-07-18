'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { addDutyZone, editDutyZone, removeDutyZone } from './actions';
import './duty-zones.css';

const WEEKDAYS = [
  { value: 1, label: 'Pzt' },
  { value: 2, label: 'Sal' },
  { value: 3, label: 'Çar' },
  { value: 4, label: 'Per' },
  { value: 5, label: 'Cum' },
  { value: 6, label: 'Cmt' },
  { value: 0, label: 'Paz' },
];

function parseBranchList(text) {
  const items = text.split(',').map((s) => s.trim()).filter(Boolean);
  return items.length ? items : null;
}

export default function DutyZonesManager({ schoolId, schoolName, initialZones }) {
  const supabase = createClient();
  const router = useRouter();
  const toastTimer = useRef(null);

  const [zones, setZones] = useState(initialZones);
  const [toast, setToast] = useState({ msg: '', isErr: false, visible: false });

  const [inpName, setInpName] = useState('');
  const [inpRequiredCount, setInpRequiredCount] = useState(1);
  const [inpPriority, setInpPriority] = useState(0);
  const [inpActiveDays, setInpActiveDays] = useState([1, 2, 3, 4, 5]);
  const [inpAllowedBranches, setInpAllowedBranches] = useState('');
  const [inpBlockedBranches, setInpBlockedBranches] = useState('');
  const [saving, setSaving] = useState(false);

  function showToast(msg, isErr = false) {
    setToast({ msg, isErr, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function toggleInpDay(value) {
    setInpActiveDays((days) => (days.includes(value) ? days.filter((d) => d !== value) : [...days, value]));
  }

  async function handleAdd() {
    const name = inpName.trim();
    if (!name) { showToast('Bölge adı giriniz!', true); return; }
    if (!inpActiveDays.length) { showToast('En az bir aktif gün seçin!', true); return; }

    setSaving(true);
    const result = await addDutyZone({
      name,
      required_count: parseInt(inpRequiredCount, 10) || 1,
      priority: parseInt(inpPriority, 10) || 0,
      active_days: inpActiveDays,
      allowed_branches: parseBranchList(inpAllowedBranches),
      blocked_branches: parseBranchList(inpBlockedBranches),
    });
    setSaving(false);

    if (result.error) { showToast(result.error, true); return; }

    setZones((z) => [...z, result.zone].sort((a, b) => (b.priority - a.priority) || a.name.localeCompare(b.name, 'tr')));
    setInpName('');
    setInpRequiredCount(1);
    setInpPriority(0);
    setInpActiveDays([1, 2, 3, 4, 5]);
    setInpAllowedBranches('');
    setInpBlockedBranches('');
    showToast(`${name} eklendi`);
  }

  async function toggleActive(zone) {
    const result = await editDutyZone(zone.id, { is_active: !zone.is_active });
    if (result.error) { showToast(result.error, true); return; }
    setZones((list) => list.map((z) => (z.id === zone.id ? result.zone : z)));
  }

  async function handleRemove(zone) {
    const result = await removeDutyZone(zone.id);
    if (result.error) { showToast(result.error, true); return; }
    setZones((list) => list.filter((z) => z.id !== zone.id));
    showToast(`${zone.name} silindi`);
  }

  return (
    <div className="zone-root">
      <header>
        <h1>🏫 Nöbet Bölgeleri</h1>
        <div className="school-name">{schoolName}</div>
        <button className="zone-btn zone-btn-outline" onClick={handleLogout}>Çıkış Yap</button>
      </header>

      <div className="zone-card">
        <h3>Yeni Bölge Ekle</h3>
        <div className="zone-form-row">
          <div>
            <label>Bölge Adı</label>
            <input type="text" placeholder="B BLOK" value={inpName} onChange={(e) => setInpName(e.target.value)} />
          </div>
          <div>
            <label>Gereken Kişi Sayısı</label>
            <input type="number" min="1" max="20" value={inpRequiredCount} onChange={(e) => setInpRequiredCount(e.target.value)} />
          </div>
          <div>
            <label>Öncelik</label>
            <input type="number" value={inpPriority} onChange={(e) => setInpPriority(e.target.value)} />
          </div>
        </div>

        <label>Aktif Günler</label>
        <div className="zone-weekday-picker">
          {WEEKDAYS.map((d) => (
            <label key={d.value} className={inpActiveDays.includes(d.value) ? 'active' : ''}>
              <input type="checkbox" checked={inpActiveDays.includes(d.value)} onChange={() => toggleInpDay(d.value)} style={{ width: 'auto' }} />
              {d.label}
            </label>
          ))}
        </div>

        <div className="zone-form-row" style={{ marginTop: 12, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label>İzinli Branşlar (virgülle, boş = herkes)</label>
            <input type="text" placeholder="sınıf, beden eğitimi" value={inpAllowedBranches} onChange={(e) => setInpAllowedBranches(e.target.value)} />
          </div>
          <div>
            <label>Yasaklı Branşlar (virgülle, boş = kısıt yok)</label>
            <input type="text" placeholder="okul öncesi" value={inpBlockedBranches} onChange={(e) => setInpBlockedBranches(e.target.value)} />
          </div>
        </div>

        <button className="zone-btn zone-btn-primary" style={{ marginTop: 14 }} onClick={handleAdd} disabled={saving}>
          + Ekle
        </button>
      </div>

      <div className="zone-card">
        <h3>Bölgeler ({zones.length})</h3>
        {zones.length === 0 ? (
          <div className="zone-empty">Henüz bölge eklenmedi.</div>
        ) : (
          <div className="zone-list">
            {zones.map((z) => (
              <div key={z.id} className={`zone-item ${z.is_active ? '' : 'inactive'}`}>
                <div className="zone-name">{z.name}</div>
                <span className="zone-tag">Kişi: {z.required_count}</span>
                <span className="zone-tag">Öncelik: {z.priority}</span>
                <span className="zone-tag">
                  Günler: {WEEKDAYS.filter((d) => z.active_days.includes(d.value)).map((d) => d.label).join(', ')}
                </span>
                {z.allowed_branches && <span className="zone-tag">İzinli: {z.allowed_branches.join(', ')}</span>}
                {z.blocked_branches && <span className="zone-tag">Yasaklı: {z.blocked_branches.join(', ')}</span>}
                <div className="zone-actions">
                  <button className="zone-btn zone-btn-outline" onClick={() => toggleActive(z)}>
                    {z.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                  <button className="zone-btn zone-btn-danger" onClick={() => handleRemove(z)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="zone-toast" className={toast.visible ? 'show' : ''} style={{ background: toast.isErr ? 'var(--danger)' : 'var(--success)', color: toast.isErr ? '#fff' : '#0f2e1a' }}>
        {toast.msg}
      </div>
    </div>
  );
}
