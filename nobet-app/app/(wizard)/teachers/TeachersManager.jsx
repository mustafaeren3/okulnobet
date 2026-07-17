'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  addTeacher,
  editTeacher,
  removeTeacher,
  fetchTeacherAvailability,
  saveTeacherAvailability,
  fetchTeskilatOgretmenleri,
} from './actions';
import './teachers.css';

const WEEKDAYS = [
  { value: 1, label: 'Pzt' },
  { value: 2, label: 'Sal' },
  { value: 3, label: 'Çar' },
  { value: 4, label: 'Per' },
  { value: 5, label: 'Cum' },
  { value: 6, label: 'Cmt' },
  { value: 0, label: 'Paz' },
];

const RESTRICTION_LABELS = { ALL: 'Kısıt yok', ONLY: 'Sadece seçili günler', EXCEPT: 'Seçili günler hariç' };

export default function TeachersManager({ schoolId, schoolName, initialTeachers }) {
  const supabase = createClient();
  const router = useRouter();
  const toastTimer = useRef(null);

  const [teachers, setTeachers] = useState(initialTeachers);
  const [toast, setToast] = useState({ msg: '', isErr: false, visible: false });
  const [expandedId, setExpandedId] = useState(null);
  const [expandedWeekdays, setExpandedWeekdays] = useState([]);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const [inpName, setInpName] = useState('');
  const [inpBranch, setInpBranch] = useState('');
  const [inpCapacity, setInpCapacity] = useState(1);
  const [inpDoubleDuty, setInpDoubleDuty] = useState(false);
  const [inpMode, setInpMode] = useState('ALL');
  const [inpWeekdays, setInpWeekdays] = useState([]);
  const [saving, setSaving] = useState(false);

  const [teskilatUrl, setTeskilatUrl] = useState('');
  const [fetchingTeskilat, setFetchingTeskilat] = useState(false);

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

  function toggleInpWeekday(value) {
    setInpWeekdays((days) => (days.includes(value) ? days.filter((d) => d !== value) : [...days, value]));
  }

  async function handleAdd() {
    const full_name = inpName.trim();
    const branch = inpBranch.trim();
    if (!full_name) { showToast('Ad soyad giriniz!', true); return; }
    if (!branch) { showToast('Branş giriniz!', true); return; }
    if (inpMode !== 'ALL' && !inpWeekdays.length) { showToast('Seçili gün(ler) giriniz!', true); return; }

    setSaving(true);
    const result = await addTeacher({
      full_name,
      branch,
      weekly_capacity: parseInt(inpCapacity, 10) || 1,
      allow_double_duty: inpDoubleDuty,
      restriction_mode: inpMode,
    });

    if (result.error) { setSaving(false); showToast(result.error, true); return; }

    if (inpMode !== 'ALL') {
      const availResult = await saveTeacherAvailability(result.teacher.id, inpWeekdays);
      if (availResult.error) { setSaving(false); showToast(availResult.error, true); return; }
    }

    setTeachers((t) => [...t, result.teacher].sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr')));
    setInpName('');
    setInpBranch('');
    setInpCapacity(1);
    setInpDoubleDuty(false);
    setInpMode('ALL');
    setInpWeekdays([]);
    setSaving(false);
    showToast(`${full_name} eklendi`);
  }

  async function handleFetchTeskilat() {
    const url = teskilatUrl.trim();
    if (!url) { showToast('Teşkilat şeması adresini giriniz!', true); return; }

    setFetchingTeskilat(true);
    const result = await fetchTeskilatOgretmenleri(url);
    setFetchingTeskilat(false);

    if (result.error) { showToast(result.error, true); return; }
    if (result.added.length) {
      setTeachers((t) => [...t, ...result.added].sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr')));
    }
    showToast(`${result.totalFound} öğretmen bulundu, ${result.added.length} eklendi (${result.skipped} zaten vardı)`);
  }

  async function toggleActive(teacher) {
    const result = await editTeacher(teacher.id, { is_active: !teacher.is_active });
    if (result.error) { showToast(result.error, true); return; }
    setTeachers((list) => list.map((t) => (t.id === teacher.id ? result.teacher : t)));
  }

  async function handleRemove(teacher) {
    const result = await removeTeacher(teacher.id);
    if (result.error) { showToast(result.error, true); return; }
    setTeachers((list) => list.filter((t) => t.id !== teacher.id));
    if (expandedId === teacher.id) setExpandedId(null);
    showToast(`${teacher.full_name} silindi`);
  }

  async function toggleExpand(teacher) {
    if (expandedId === teacher.id) { setExpandedId(null); return; }
    setExpandedId(teacher.id);
    if (teacher.restriction_mode === 'ALL') { setExpandedWeekdays([]); return; }
    const result = await fetchTeacherAvailability(teacher.id);
    if (result.error) { showToast(result.error, true); return; }
    setExpandedWeekdays(result.weekdays);
  }

  function toggleExpandedWeekday(value) {
    setExpandedWeekdays((days) => (days.includes(value) ? days.filter((d) => d !== value) : [...days, value]));
  }

  async function handleSaveAvailability(teacher) {
    setSavingAvailability(true);
    const result = await saveTeacherAvailability(teacher.id, expandedWeekdays);
    setSavingAvailability(false);
    if (result.error) { showToast(result.error, true); return; }
    showToast('Müsaitlik güncellendi');
  }

  return (
    <div className="teach-root">
      <header>
        <h1>👤 Öğretmen Yönetimi</h1>
        <div className="school-name">{schoolName}</div>
        <button className="teach-btn teach-btn-outline" onClick={handleLogout}>Çıkış Yap</button>
      </header>

      <div className="teach-card">
        <h3>Yeni Öğretmen Ekle</h3>
        <div className="teach-form-row">
          <div>
            <label>Ad Soyad</label>
            <input type="text" placeholder="AYŞE YILMAZ" value={inpName} onChange={(e) => setInpName(e.target.value)} />
          </div>
          <div>
            <label>Branş</label>
            <input type="text" placeholder="Sınıf öğretmeni" value={inpBranch} onChange={(e) => setInpBranch(e.target.value)} />
          </div>
          <div>
            <label>Haftalık Kapasite</label>
            <input type="number" min="1" max="10" value={inpCapacity} onChange={(e) => setInpCapacity(e.target.value)} />
          </div>
          <div>
            <label>Gün Kısıtı</label>
            <select value={inpMode} onChange={(e) => { setInpMode(e.target.value); setInpWeekdays([]); }}>
              {Object.entries(RESTRICTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {inpMode !== 'ALL' && (
          <div className="teach-weekday-picker">
            {WEEKDAYS.map((d) => (
              <label key={d.value} className={inpWeekdays.includes(d.value) ? 'active' : ''}>
                <input type="checkbox" checked={inpWeekdays.includes(d.value)} onChange={() => toggleInpWeekday(d.value)} style={{ width: 'auto' }} />
                {d.label}
              </label>
            ))}
          </div>
        )}

        <label className="teach-checkbox-row" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={inpDoubleDuty} onChange={(e) => setInpDoubleDuty(e.target.checked)} style={{ width: 'auto' }} />
          Gerekirse çift nöbet tutabilir (x2)
        </label>

        <button className="teach-btn teach-btn-primary" style={{ marginTop: 14 }} onClick={handleAdd} disabled={saving}>
          + Ekle
        </button>

        <div className="teach-info-box" style={{ marginTop: 20 }}>
          💡 Okulunun MEB web sitesindeki teşkilat şeması (kadromuz) adresini gir, sınıf ve branş öğretmenlerini otomatik çeksin (müdür, müdür yardımcıları, rehber ve anaokulu öğretmenleri hariç tutulur):
          <input
            type="text"
            placeholder="https://okulunuz.meb.k12.tr/tema/teskilat_semasi.html"
            value={teskilatUrl}
            onChange={(e) => setTeskilatUrl(e.target.value)}
            style={{ marginTop: 8 }}
          />
          <button className="teach-btn teach-btn-outline" style={{ marginTop: 8, width: '100%' }} onClick={handleFetchTeskilat} disabled={fetchingTeskilat}>
            {fetchingTeskilat ? 'Çekiliyor...' : '👥 Teşkilat Şemasından Öğretmenleri Çek'}
          </button>
        </div>
      </div>

      <div className="teach-card">
        <h3>Öğretmenler ({teachers.length})</h3>
        {teachers.length === 0 ? (
          <div className="teach-empty">Henüz öğretmen eklenmedi.</div>
        ) : (
          <div className="teach-list">
            {teachers.map((t) => (
              <div key={t.id}>
                <div className={`teach-item ${t.is_active ? '' : 'inactive'}`}>
                  <div>
                    <div className="teach-name">{t.full_name}</div>
                    <div className="teach-branch">{t.branch}</div>
                  </div>
                  <span className="teach-tag">Kapasite: {t.weekly_capacity}</span>
                  {t.allow_double_duty && <span className="teach-tag">Çift nöbet x2</span>}
                  <span className="teach-tag">{RESTRICTION_LABELS[t.restriction_mode]}</span>
                  <div className="teach-actions">
                    <button className="teach-btn teach-btn-outline" onClick={() => toggleExpand(t)}>
                      {expandedId === t.id ? 'Kapat' : 'Müsaitlik'}
                    </button>
                    <button className="teach-btn teach-btn-outline" onClick={() => toggleActive(t)}>
                      {t.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                    <button className="teach-btn teach-btn-danger" onClick={() => handleRemove(t)}>Sil</button>
                  </div>
                </div>
                {expandedId === t.id && (
                  <div className="teach-card" style={{ marginTop: 8, marginBottom: 8 }}>
                    {t.restriction_mode === 'ALL' ? (
                      <div className="teach-empty">Bu öğretmende gün kısıtı yok (Gün Kısıtı: Kısıt yok).</div>
                    ) : (
                      <>
                        <label>{RESTRICTION_LABELS[t.restriction_mode]} — günleri seç</label>
                        <div className="teach-weekday-picker">
                          {WEEKDAYS.map((d) => (
                            <label key={d.value} className={expandedWeekdays.includes(d.value) ? 'active' : ''}>
                              <input type="checkbox" checked={expandedWeekdays.includes(d.value)} onChange={() => toggleExpandedWeekday(d.value)} style={{ width: 'auto' }} />
                              {d.label}
                            </label>
                          ))}
                        </div>
                        <button className="teach-btn teach-btn-primary" style={{ marginTop: 12 }} onClick={() => handleSaveAvailability(t)} disabled={savingAvailability}>
                          Kaydet
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="teach-toast" className={toast.visible ? 'show' : ''} style={{ background: toast.isErr ? 'var(--danger)' : 'var(--success)', color: toast.isErr ? '#fff' : '#0f2e1a' }}>
        {toast.msg}
      </div>
    </div>
  );
}
