'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  PALETTE,
  RESTRICT_LABELS,
  DAY_TR,
  DIST_METHODS,
  ACADEMIC_YEAR_2026_2027_HOLIDAYS,
  ymdStr,
  formatDate,
  groupByWeek,
  luminance,
  generateSchedule as computeSchedule,
} from '@/lib/engine/schedule';
import { fetchTeskilatOgretmenleri } from './actions';
import './dashboard.css';

const WEEKDAYS = [
  { value: 1, label: 'Pzt' },
  { value: 2, label: 'Sal' },
  { value: 3, label: 'Çar' },
  { value: 4, label: 'Per' },
  { value: 5, label: 'Cum' },
  { value: 6, label: 'Cmt' },
  { value: 0, label: 'Paz' },
];

export default function Dashboard({ schoolId, schoolName, initialPersons, initialLocations, initialHolidays, initialSettings }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const tableRef = useRef(null);
  const toastTimer = useRef(null);

  const [activeTab, setActiveTab] = useState('ayarlar');
  const [persons, setPersons] = useState(initialPersons);
  const [locations, setLocations] = useState(initialLocations);
  const [holidays, setHolidays] = useState(() => {
    const map = {};
    initialHolidays.forEach((h) => { map[h.holiday_date] = h.description; });
    return map;
  });

  const [startDate, setStartDate] = useState(initialSettings?.start_date || '2026-09-14');
  const [endDate, setEndDate] = useState(initialSettings?.end_date || '2027-06-25');
  const [activeDays, setActiveDays] = useState(initialSettings?.active_days || [1, 2, 3, 4, 5]);
  const [distMethod, setDistMethod] = useState(initialSettings?.dist_method || 'haftalik-gun-yer');

  const [teskilatUrl, setTeskilatUrl] = useState(initialSettings?.teskilat_url || '');
  const [fetchingTeskilat, setFetchingTeskilat] = useState(false);

  const [inpName, setInpName] = useState('');
  const [inpNum, setInpNum] = useState('');
  const [inpRestrict, setInpRestrict] = useState('');
  const [inpDoubleDuty, setInpDoubleDuty] = useState(false);
  const [inpLoc, setInpLoc] = useState('');
  const [inpHolidayDate, setInpHolidayDate] = useState('');
  const [inpHolidayDesc, setInpHolidayDesc] = useState('');

  const [result, setResult] = useState(null); // { schedule, totalCount }
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', isErr: false, visible: false });

  function showToast(msg, isErr = false) {
    setToast({ msg, isErr, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  function nextColor() {
    const used = persons.map((p) => p.color);
    return PALETTE.find((c) => !used.includes(c)) || PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // ── PERSONS ─────────────────────────────────────────────
  async function addPerson() {
    const name = inpName.trim().toUpperCase();
    if (!name) { showToast('İsim giriniz!', true); return; }
    if (persons.find((p) => p.name === name)) { showToast('Bu isim zaten var!', true); return; }
    const num = parseInt(inpNum, 10) || persons.length + 1;

    const { data, error } = await supabase
      .from('staff')
      .insert({ school_id: schoolId, name, num, restrict_code: inpRestrict || null, color: nextColor(), allow_double_duty: inpDoubleDuty })
      .select()
      .single();

    if (error) { showToast(error.message, true); return; }
    setPersons((p) => [...p, data]);
    setInpName('');
    setInpNum('');
    setInpRestrict('');
    setInpDoubleDuty(false);
    showToast(`${name} eklendi`);
  }

  async function toggleDoubleDuty(id, current) {
    const { error } = await supabase.from('staff').update({ allow_double_duty: !current }).eq('id', id);
    if (error) { showToast(error.message, true); return; }
    setPersons((list) => list.map((p) => (p.id === id ? { ...p, allow_double_duty: !current } : p)));
  }

  async function handleFetchTeskilat() {
    const url = teskilatUrl.trim();
    if (!url) { showToast('Teşkilat şeması adresini giriniz!', true); return; }

    setFetchingTeskilat(true);
    const result = await fetchTeskilatOgretmenleri(schoolId, url);
    setFetchingTeskilat(false);

    if (result.error) { showToast(result.error, true); return; }
    if (result.added.length) setPersons((p) => [...p, ...result.added]);
    showToast(`${result.totalFound} öğretmen bulundu, ${result.added.length} eklendi (${result.skipped} zaten vardı)`);
  }

  async function removePerson(id, name) {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) { showToast(error.message, true); return; }
    setPersons((p) => p.filter((x) => x.id !== id));
    showToast(`${name} silindi`);
  }

  // ── LOCATIONS ───────────────────────────────────────────
  async function addLocation() {
    const name = inpLoc.trim().toUpperCase();
    if (!name || locations.find((l) => l.name === name)) { showToast('Geçersiz veya mevcut lokasyon!', true); return; }

    const { data, error } = await supabase
      .from('locations')
      .insert({ school_id: schoolId, name })
      .select()
      .single();

    if (error) { showToast(error.message, true); return; }
    setLocations((l) => [...l, data]);
    setInpLoc('');
    showToast(`${name} eklendi`);
  }

  async function removeLocation(id) {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) { showToast(error.message, true); return; }
    setLocations((l) => l.filter((x) => x.id !== id));
  }

  // ── HOLIDAYS ────────────────────────────────────────────
  async function addHoliday() {
    if (!inpHolidayDate) { showToast('Tarih seçiniz!', true); return; }
    const desc = inpHolidayDesc || 'Tatil';

    const { error } = await supabase
      .from('holidays')
      .upsert({ school_id: schoolId, holiday_date: inpHolidayDate, description: desc }, { onConflict: 'school_id,holiday_date' });

    if (error) { showToast(error.message, true); return; }
    setHolidays((h) => ({ ...h, [inpHolidayDate]: desc }));
    showToast(`${formatDate(inpHolidayDate)} tatil olarak eklendi`);
    setInpHolidayDate('');
    setInpHolidayDesc('');
  }

  async function removeHoliday(date) {
    const { error } = await supabase.from('holidays').delete().eq('school_id', schoolId).eq('holiday_date', date);
    if (error) { showToast(error.message, true); return; }
    setHolidays((h) => {
      const next = { ...h };
      delete next[date];
      return next;
    });
  }

  async function loadAcademicYearHolidays() {
    const rows = Object.entries(ACADEMIC_YEAR_2026_2027_HOLIDAYS).map(([holiday_date, description]) => ({
      school_id: schoolId,
      holiday_date,
      description,
    }));
    const { error } = await supabase.from('holidays').upsert(rows, { onConflict: 'school_id,holiday_date' });
    if (error) { showToast(error.message, true); return; }
    setHolidays((h) => ({ ...h, ...ACADEMIC_YEAR_2026_2027_HOLIDAYS }));
    showToast('2026-2027 eğitim öğretim yılı tatilleri yüklendi ✓');
  }

  function toggleWeekday(value) {
    setActiveDays((days) => (days.includes(value) ? days.filter((d) => d !== value) : [...days, value]));
  }

  // ── SCHEDULE ────────────────────────────────────────────
  async function handleGenerateSchedule() {
    if (!startDate || !endDate) { showToast('Başlangıç ve bitiş tarihi giriniz!', true); return; }
    if (!persons.length) { showToast('En az bir kişi ekleyin!', true); return; }
    if (!locations.length) { showToast('En az bir lokasyon ekleyin!', true); return; }
    if (!activeDays.length) { showToast('En az bir gün seçin!', true); return; }

    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .update({ start_date: startDate, end_date: endDate, active_days: activeDays, dist_method: distMethod })
      .eq('school_id', schoolId);
    setSaving(false);

    if (error) { showToast(error.message, true); return; }

    const computed = computeSchedule({ persons, locations, holidays, activeDays, startDate, endDate, distMethod });
    if (!computed) { showToast('Seçili aralıkta aktif gün bulunamadı!', true); return; }

    setResult(computed);
    setActiveTab('program');
    const activeCount = computed.schedule.filter((s) => !s.isHoliday).length;
    const holCount = computed.schedule.filter((s) => s.isHoliday).length;
    showToast(`✓ ${activeCount} aktif gün, ${holCount} tatil programlandı!`);
  }

  // ── EXPORT ──────────────────────────────────────────────
  function exportCSV() {
    if (!result) return;
    let csv = 'TARİH,GÜN,' + locations.map((l) => l.name).join(',') + '\n';
    result.schedule.forEach((slot) => {
      const row = [formatDate(slot.ymd), DAY_TR[slot.date.getDay()]];
      locations.forEach((loc) => {
        const p = slot.slots[loc.name];
        row.push(p ? p.name : '');
      });
      csv += row.map((r) => `"${r}"`).join(',') + '\n';
    });
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nobet_programi.csv';
    a.click();
    showToast('CSV indirildi');
  }

  function exportHTML() {
    if (!tableRef.current) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Nöbet Programı</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px}table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ccc;padding:5px 8px;text-align:center}th{background:#1F3864;color:#fff}
    .week-header td{background:#e8f0fe;font-weight:bold;text-align:left}</style></head>
    <body><h2>NÖBET PROGRAMI</h2>${tableRef.current.outerHTML}</body></html>`);
    w.document.close();
    w.print();
  }

  const weeks = result ? groupByWeek(result.schedule) : [];
  const totalSlots = result ? result.schedule.reduce((a, s) => a + Object.values(s.slots).filter(Boolean).length, 0) : 0;
  const maxCount = result ? Math.max(...Object.values(result.totalCount), 1) : 1;
  const sortedPersons = result ? [...persons].sort((a, b) => (result.totalCount[b.name] || 0) - (result.totalCount[a.name] || 0)) : [];
  const sortedHolidayDates = Object.keys(holidays).sort();

  return (
    <div className="dash-root">
      <header>
        <div className="logo">NÖBET SİSTEMİ</div>
        <div className="badge">OTOMATİK</div>
        <div className="school-name">{schoolName}</div>
        <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
      </header>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'ayarlar' ? 'active' : ''}`} onClick={() => setActiveTab('ayarlar')}>⚙️ Ayarlar</button>
        <button className={`tab-btn ${activeTab === 'program' ? 'active' : ''}`} onClick={() => setActiveTab('program')}>📅 Program</button>
        <button className={`tab-btn ${activeTab === 'dagitim' ? 'active' : ''}`} onClick={() => setActiveTab('dagitim')}>📊 Dağılım</button>
      </div>

      {/* ═══════ TAB: AYARLAR ═══════ */}
      <div className={`tab-content ${activeTab === 'ayarlar' ? 'active' : ''}`}>
        <div className="two-col">
          <div>
            <div className="card">
              <h3>👤 Personel Yönetimi</h3>
              <div className="info-box">Kişi ekle/sil → program otomatik yeniden hesaplanır.</div>

              <div className="form-row-3">
                <div>
                  <label>Ad Soyad</label>
                  <input
                    type="text"
                    placeholder="AYŞE YILMAZ"
                    value={inpName}
                    onChange={(e) => setInpName(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label>Sıra No</label>
                  <input type="number" placeholder="20" min="1" max="99" value={inpNum} onChange={(e) => setInpNum(e.target.value)} />
                </div>
                <div>
                  <label>Kısıt</label>
                  <select value={inpRestrict} onChange={(e) => setInpRestrict(e.target.value)}>
                    <option value="">Yok</option>
                    <optgroup label="Sadece Bu Gün Çalışsın">
                      <option value="MON">Sadece Pazartesi</option>
                      <option value="TUE">Sadece Salı</option>
                      <option value="WED">Sadece Çarşamba</option>
                      <option value="THU">Sadece Perşembe</option>
                      <option value="FRI">Sadece Cuma</option>
                    </optgroup>
                    <optgroup label="Bu Gün Hariç Çalışsın">
                      <option value="NO_MON">Pazartesi Hariç</option>
                      <option value="NO_TUE">Salı Hariç</option>
                      <option value="NO_WED">Çarşamba Hariç</option>
                      <option value="NO_THU">Perşembe Hariç</option>
                      <option value="NO_FRI">Cuma Hariç</option>
                    </optgroup>
                  </select>
                </div>
                <div style={{ alignSelf: 'end' }}>
                  <button className="btn btn-primary" onClick={addPerson}>+ Ekle</button>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'none', fontSize: 12, color: 'var(--muted)', marginBottom: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={inpDoubleDuty} onChange={(e) => setInpDoubleDuty(e.target.checked)} style={{ width: 'auto' }} />
                Gerekirse çift nöbet tutabilir
              </label>

              <div className="person-list">
                {persons.map((p) => {
                  const label = RESTRICT_LABELS[p.restrict_code];
                  const isExcept = p.restrict_code && p.restrict_code.startsWith('NO_');
                  return (
                    <div className="person-item" key={p.id}>
                      <div className="person-color" style={{ background: `#${p.color}` }} />
                      <span className="person-name">{p.name}</span>
                      {label && <span className={`person-tag ${isExcept ? 'tag-except' : 'tag-wed'}`}>{label}</span>}
                      <button
                        className={`person-tag ${p.allow_double_duty ? 'tag-new' : ''}`}
                        style={!p.allow_double_duty ? { background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' } : { cursor: 'pointer', border: 'none' }}
                        title="Gerekirse çift nöbet tutabilir"
                        onClick={() => toggleDoubleDuty(p.id, p.allow_double_duty)}
                      >
                        2×
                      </button>
                      <button className="person-del" onClick={() => removePerson(p.id, p.name)}>×</button>
                    </div>
                  );
                })}
              </div>

              <div className="sep" />
              <div className="info-box" style={{ marginBottom: 0 }}>
                💡 Okulunun MEB web sitesindeki teşkilat şeması adresini gir, sınıf ve branş öğretmenlerini otomatik çeksin (müdür yardımcıları, rehber, özel eğitim ve anaokulu öğretmenleri hariç tutulur):
                <input
                  type="text"
                  placeholder="https://okulunuz.meb.k12.tr/tema/teskilat.php"
                  value={teskilatUrl}
                  onChange={(e) => setTeskilatUrl(e.target.value)}
                  style={{ marginTop: 8 }}
                />
                <button className="btn btn-outline" style={{ marginTop: 8, width: '100%' }} onClick={handleFetchTeskilat} disabled={fetchingTeskilat}>
                  {fetchingTeskilat ? 'Çekiliyor...' : '👥 Teşkilat Şemasından Öğretmenleri Çek'}
                </button>
              </div>
            </div>

            <div className="card">
              <h3>🏫 Lokasyonlar</h3>
              <div className="form-row">
                <div>
                  <label>Lokasyon Adı</label>
                  <input type="text" placeholder="B BLOK" value={inpLoc} onChange={(e) => setInpLoc(e.target.value.toUpperCase())} />
                </div>
                <div style={{ alignSelf: 'end' }}>
                  <button className="btn btn-primary" onClick={addLocation}>+ Ekle</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {locations.map((loc) => (
                  <div key={loc.id} style={{ background: '#1a5276', border: '1px solid #375623', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#ccc' }}>
                    {loc.name}
                    <button onClick={() => removeLocation(loc.id)} style={{ background: 'none', border: 'none', color: '#f74f4f', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <h3>📆 Program Tarihleri</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div><label>Başlangıç</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                <div><label>Bitiş</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              </div>
              <div>
                <label>Nöbet Günleri</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {WEEKDAYS.map((d) => (
                    <label key={d.value} className={`wdcheck ${activeDays.includes(d.value) ? 'active' : ''}`}>
                      <input type="checkbox" checked={activeDays.includes(d.value)} onChange={() => toggleWeekday(d.value)} /> {d.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h3>🎌 Resmi Tatiller & İstisna Günler</h3>
              <div className="form-row">
                <div><label>Tarih</label><input type="date" value={inpHolidayDate} onChange={(e) => setInpHolidayDate(e.target.value)} /></div>
                <div><label>Açıklama</label><input type="text" placeholder="Cumhuriyet Bayramı" value={inpHolidayDesc} onChange={(e) => setInpHolidayDesc(e.target.value)} /></div>
                <div style={{ alignSelf: 'end' }}><button className="btn btn-danger" onClick={addHoliday}>+ Ekle</button></div>
              </div>
              <div className="holiday-list">
                {sortedHolidayDates.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>Henüz tatil eklenmedi</div>
                )}
                {sortedHolidayDates.map((d) => (
                  <div className="holiday-tag" key={d}>
                    🗓 {formatDate(d)} – {holidays[d]}
                    <button onClick={() => removeHoliday(d)}>×</button>
                  </div>
                ))}
              </div>

              <div className="sep" />
              <div className="info-box" style={{ marginBottom: 0 }}>
                💡 2026-2027 eğitim öğretim yılı resmi tatillerini otomatik yükle:
                <button className="btn btn-outline" style={{ marginTop: 8, width: '100%' }} onClick={loadAcademicYearHolidays}>
                  🇹🇷 2026-2027 Eğitim Öğretim Yılı Tatillerini Yükle
                </button>
              </div>
            </div>

            <div className="card">
              <h3>⚖️ Dağıtım Ayarları</h3>
              <div>
                <label>Dağıtım Yöntemi</label>
                <select value={distMethod} onChange={(e) => setDistMethod(e.target.value)}>
                  {Object.entries(DIST_METHODS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button className="btn btn-success btn-xl" onClick={handleGenerateSchedule} disabled={saving}>
              ✨ PROGRAM OLUŞTUR
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ TAB: PROGRAM ═══════ */}
      <div className={`tab-content ${activeTab === 'program' ? 'active' : ''}`}>
        {!result ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2 }}>Henüz program oluşturulmadı</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>Ayarlar sekmesinden personel ve tarihleri belirleyin</div>
          </div>
        ) : (
          <div>
            <div className="stats-grid">
              <div className="stat-card"><span className="stat-icon">📅</span><div><div className="stat-num">{result.schedule.length}</div><div className="stat-lbl">Aktif Gün</div></div></div>
              <div className="stat-card"><span className="stat-icon">👥</span><div><div className="stat-num">{persons.length}</div><div className="stat-lbl">Personel</div></div></div>
              <div className="stat-card"><span className="stat-icon">🏫</span><div><div className="stat-num">{locations.length}</div><div className="stat-lbl">Lokasyon</div></div></div>
              <div className="stat-card"><span className="stat-icon">✅</span><div><div className="stat-num">{totalSlots}</div><div className="stat-lbl">Toplam Nöbet</div></div></div>
            </div>
            <div className="schedule-wrapper">
              <table className="schedule-table" ref={tableRef}>
                <thead>
                  <tr>
                    <th>TARİH</th>
                    <th>GÜN</th>
                    {locations.map((l) => <th key={l.id}>{l.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((wk, wi) => (
                    <Fragment key={`w-${wi}`}>
                      <tr className="week-header">
                        <td colSpan={2 + locations.length}>
                          HAFTA {wi + 1}  ({formatDate(wk[0].ymd)} – {formatDate(wk[wk.length - 1].ymd)})
                        </td>
                      </tr>
                      {wk.map((slot) => (
                        <tr key={slot.ymd}>
                          <td className="td-date">{formatDate(slot.ymd)}</td>
                          <td className="td-day">{DAY_TR[slot.date.getDay()]}</td>
                          {slot.isHoliday ? (
                            <td className="td-holiday" colSpan={locations.length}>🎌 {holidays[slot.ymd] || 'Tatil'} — KAPALI</td>
                          ) : (
                            locations.map((loc) => {
                              const person = slot.slots[loc.name];
                              return person ? (
                                <td key={loc.id} style={{ background: `#${person.color}`, color: luminance(person.color) > 140 ? '#000' : '#fff' }}>
                                  {person.name}
                                </td>
                              ) : (
                                <td key={loc.id} className="td-empty">—</td>
                              );
                            })
                          )}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="export-section">
              <button className="btn btn-primary btn-lg" onClick={exportCSV}>📥 CSV İndir</button>
              <button className="btn btn-outline btn-lg" onClick={exportHTML}>🖨️ Yazdır / HTML</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ TAB: DAĞILIM ═══════ */}
      <div className={`tab-content ${activeTab === 'dagitim' ? 'active' : ''}`}>
        {!result ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2 }}>Program henüz oluşturulmadı</div>
          </div>
        ) : (
          <div className="card">
            <h3>📊 Kişi Başı Nöbet Dağılımı</h3>
            <table className="distrib-table">
              <thead>
                <tr><th>Renk</th><th>Ad Soyad</th><th>Nöbet Sayısı</th><th>Dağılım</th><th>Kısıt</th></tr>
              </thead>
              <tbody>
                {sortedPersons.map((p) => {
                  const c = result.totalCount[p.name] || 0;
                  const pct = Math.round((c / maxCount) * 100);
                  const tag = RESTRICT_LABELS[p.restrict_code] || '';
                  return (
                    <tr key={p.id}>
                      <td><div className="person-color" style={{ background: `#${p.color}`, margin: 'auto' }} /></td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                      <td style={{ textAlign: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--accent)' }}>{c}</td>
                      <td><div className="distrib-bar-wrap"><div className="distrib-bar" style={{ width: `${pct}%`, background: `#${p.color}` }} /></div></td>
                      <td style={{ color: 'var(--muted)', fontSize: 11 }}>{tag}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div id="toast" className={toast.visible ? 'show' : ''} style={{ background: toast.isErr ? 'var(--danger)' : 'var(--success)', color: toast.isErr ? '#fff' : '#0f2e1a' }}>
        {toast.msg}
      </div>
    </div>
  );
}
