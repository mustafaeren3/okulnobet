'use client';

import { Fragment, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Settings, Calendar, BarChart3, User, Users, MapPin, Lightbulb, School,
  CalendarDays, AlertTriangle, Flag, Scale, Puzzle, Crown, Check, Sparkles,
  Eye, Lock, CheckCircle2, Download, FileText, Link2, Printer, Timer, PartyPopper, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getWeekStart } from '@/lib/engine/rotation';
import { getWeekday, DAY_TR } from '@/lib/engine/weekday';
import { eachDateStr } from '@/lib/engine/scheduler';
import { HARD_RULE_KEYS, HARD_RULE_LABELS } from '@/lib/db/rules';
import { getSubscriptionStatus } from '@/lib/engine/subscription';
import { STANDARD_YEARLY_PRICE, formatTL } from '@/lib/engine/pricing';
import { isPremium, canAccessFeature, FEATURES } from '@/lib/engine/access';
import {
  addTeacher,
  editTeacher,
  removeTeacher,
  fetchTeacherAvailability,
  saveTeacherAvailability,
  fetchTeskilatOgretmenleri,
} from '../teachers/actions';
import { addDutyZone, editDutyZone, removeDutyZone } from '../duty-zones/actions';
import {
  runBulkSchedule,
  previewBulkSchedule,
  updateRotationMode,
  updateSchoolPrincipalName,
  updateSchoolAssistantPrincipalName,
  fetchScheduleView,
  fetchScheduleMonth,
  fetchTeacherOptions,
  addManualAssignment,
  removeAssignment,
  addHoliday,
  removeHoliday,
  loadDefaultHolidays,
  createShareLink,
  removeShareLink,
} from '../schedule/actions';
import { toggleRule } from '../rules/actions';
import PremiumScreen from './PremiumScreen';
import Logo from '../../components/Logo';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import Modal from '../../components/Modal';
import { useToast } from '../../components/useToast';
import './dashboard.css';

// Faz 7.3: kullanıcı ilk tasarıma (tek sayfa, 3 sekme: Ayarlar/Program/
// Dağılım) dönülmesini istedi — Faz 7.2'nin 5 sekmeli (Öğretmenler/
// Bölgeler/Program/Kurallar/Hesabım) hâli hâlâ "karmaşık" bulundu. Bu
// dosya artık eski (panel) Dashboard.jsx'in görünümünü/yapısını birebir
// hedefliyor, ama verisi ve motoru YENİ sistemden (teachers/duty_zones/
// calendar_days/rules/subscriptions + lib/db/bulkSchedule.js) geliyor —
// eski staff/locations/holidays tablolarına veya eski istemci taraflı
// motora dönüş yok (Faz 7.1'in düzelttiği hataları geri getirir).
// Kurallar/Hesabım eski tasarımda yoktu (sonradan eklenen gerçek
// özellikler — deneme süresi kısıtlaması, kural aç/kapa) — ayrı sekme
// açmak yerine Ayarlar sekmesine ek kart olarak kondu, böylece sekme
// sayısı eski tasarımdaki gibi 3'te kaldı.

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

const ROTATION_MODE_LABELS = {
  haftalik_yer: 'Haftalık nöbet (döngü bitince gün de değişir)',
  aylik_ayni_gun: 'Aylık yer döngüsü (aynı gün, farklı yer)',
  aylik_farkli_gun: 'Aylık döngü (farklı gün, farklı yer)',
};

// Dönme düzeni seçiminin altında, seçilen moda göre değişen açıklama +
// somut örnek (kullanıcının kendi tarifiyle yazıldı — kısa etiket
// seçmek yeterli olmuyordu, "nasıl işliyor" sorusu tekrar tekrar geldi).
const ROTATION_MODE_DESCRIPTIONS = {
  haftalik_yer:
    'Her öğretmen belirlenen döngüde nöbet tuttuktan sonra, nöbet tuttuğu GÜN haftanın bir sonraki sırasındaki gün olarak otomatik değişir. ' +
    'Örnek: 4 nöbet yeri (A, B, C, D) varsa bir öğretmen sırasıyla Pazartesi A, sonraki hafta Pazartesi B, sonra Pazartesi C, sonra Pazartesi D nöbeti tutar; ' +
    'D bittiğinde döngü tamamlanmış olur ve bir sonraki hafta artık SALI günü A\'dan yeniden başlar.',
  aylik_ayni_gun:
    'Öğretmen her ay AYNI gün, FARKLI bir yerde nöbet tutar. Nöbet tuttuğu yer döngüsü (tüm nöbet yerleri) tamamlanınca yerler arasında baştan tekrar eder, gün hep sabit kalır. ' +
    'Örnek: bir öğretmen her ayın ilk Pazartesi\'sinde nöbet tutuyorsa: Eylül\'de A Blok, Ekim\'de B Blok, Kasım\'da C Blok... tüm yerler bitince tekrar A Blok\'a döner — gün her zaman Pazartesi kalır.',
  aylik_farkli_gun:
    'Öğretmen her ay hem FARKLI bir yerde hem FARKLI bir günde nöbet tutar. Yerler döngüye göre değiştiği gibi, günler de haftanın günlerine göre sırayla döner. ' +
    'Örnek: Eylül\'de Pazartesi A Blok, Ekim\'de Salı B Blok, Kasım\'da Çarşamba C Blok şeklinde hem yer hem gün birlikte ilerler.',
};

// Resmi nöbet çizelgesi çıktısında sabit metin olarak basılır (MEB
// okullarında yaygın kullanılan standart nöbetçi öğretmen görev tanımı).
const DUTY_TEACHER_RESPONSIBILITIES = [
  'Nöbet görevi ders başlangıç saatinden 15 dakika önce başlar. Ders bitiminden 15 dakika sonra biter. Öğretmen nöbet günlerinde bu kurala riayet ederek görevine gelir.',
  'Okulun eğitim, öğretim ve yönetim işlerinin düzenli yürütülmesinde okul yöneticilerine yardımcı olur, öğrencilerin problemleri ile ilgilenerek gerekli yardımlarda bulunur.',
  'Okulun günlük havalandırma, ısıtma ve temizlik işlerinin zamanında yapılıp yapılmadığını kontrol eder, eksiklerin giderilmesi için gerekli tedbirleri alır.',
  'Bayrak törenlerinin zamanında gereken önemin verilerek yapılmasını sağlar.',
  'Nöbetçi müdür yardımcısı ile işbirliği içerisinde boş derslerin doldurulması, yoklamaların alınmasına yardımcı olur.',
  'Teneffüslerde öğrencilerin derslere zamanında ve güvenli şekilde girip çıkmaları için gerekli tedbirleri alır.',
  'Okula gelen ve giden ziyaretçileri kontrol eder ve durumlarıyla ilgilenir.',
  'Okul idaresince verilen eğitim ve öğretim ile ilgili görevleri yapar.',
];

// Eski tasarımın renk paleti + parlaklık hesabı (lib/engine/schedule.js
// Faz 7.1'de kaldırıldı — eski staff.color sütununa dayanıyordu, yeni
// teachers tablosunda böyle bir sütun yok). Öğretmen adına göre kalıcı
// bir renk üretmek için isim hash'lenir — DB'de saklanmaz, salt görsel.
const PALETTE = [
  '4472C4', 'ED7D31', 'A9D18E', 'FF6666', '00B0F0', 'D4C400', '00B050',
  '9966CC', 'FF8533', '9999FF', 'E05252', '00CCCC', '339966', 'D4A300',
  '999999', '843C0C', '4C8C5C', '2E75B6', 'FF69B4', 'E040FB', '26A69A',
  'F06292', '8D6E63', '78909C', 'D4E157', 'FF7043', '5C6BC0', 'AB47BC',
];
function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
function luminance(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
function formatDate(ymd) {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

// Yazdırma çıktısı document.write ile ham HTML olarak kuruluyor —
// öğretmen adı/tatil açıklaması/okul adı gibi kullanıcı girdisi metinler
// buraya basılmadan önce kaçışlanmalı (HTML enjeksiyonuna kapalı olsun).
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// duty_assignments satırlarını (teachers/duty_zones join'li) tarih ×
// bölge tablosuna indirger. Sütun sırası = rotasyon sırası (öncelik,
// sonra eklenme sırası) — alfabetik sıralanırsa doğru rotasyon bile
// ekranda karışık görünür.
//
// `dates` ve `zoneNames` SADECE atama satırı olan gün/bölgelerden değil,
// sorgulanan ARALIKTAN (range) ve okulun GÜNCEL aktif bölge listesinden
// (zones) üretilir — aksi halde bir gün veya bölge, o gün/bölge için HİÇ
// atama üretilmemişse (örn. haftalık limit yüzünden uygun kimse
// kalmamıştı — bkz. max_duty_per_week) tablodan tamamen KAYBOLUR, oysa
// idarecinin boş bir satır/sütun olarak görüp elle doldurabilmesi gerekir.
function buildScheduleTable(rows, range, zones) {
  const cellMap = {};

  for (const row of rows) {
    const date = row.duty_date;
    const zoneName = row.duty_zones?.name ?? '—';
    cellMap[date] ??= {};
    (cellMap[date][zoneName] ??= []).push({
      id: row.id,
      name: row.teachers?.full_name ?? '—',
      isManual: row.is_manual,
    });
  }

  const sortedZones = [...zones].sort(
    (a, b) => (b.priority - a.priority) || a.created_at.localeCompare(b.created_at)
  );
  const zoneNames = sortedZones.map((z) => z.name);
  const zoneIdByName = new Map(sortedZones.map((z) => [z.name, z.id]));

  const dates = range
    ? eachDateStr(range.start, range.end).filter((d) => {
        const w = getWeekday(d);
        return w >= 1 && w <= 5;
      })
    : [...new Set(rows.map((r) => r.duty_date))].sort();

  return { dates, zoneNames, zoneIdByName, cellMap };
}

// Sıralı tarihleri ardışık haftalara gruplar (eski tasarımın "HAFTA N"
// başlıkları için).
function groupDatesByWeek(dates) {
  const weeks = [];
  let curWeekStart = null;
  let cur = null;
  for (const date of dates) {
    const ws = getWeekStart(date);
    if (ws !== curWeekStart) {
      cur = [];
      weeks.push(cur);
      curWeekStart = ws;
    }
    cur.push(date);
  }
  return weeks;
}

// CSV/PDF/Excel export'larının üçü de aynı "tarih × bölge" hücre
// metnini farklı bir dosya biçimine döküyor — tekrarlanan hücre-metni
// mantığını (tatil satırı / dolu hücrelerin isim listesi) tek yerde
// toplar (2. somut kullanımda soyutlama eşiği geçildi, CLAUDE.md
// sadelik kuralına uygun). Saf: DOM/Blob bilmez, sadece dizi döner.
function buildExportGrid(table, holidaysByDate) {
  const header = ['TARİH', 'GÜN', ...table.zoneNames];
  const rows = table.dates.map((date) => {
    const holidayDesc = holidaysByDate.get(date);
    const dayLabel = DAY_TR[getWeekday(date)];
    if (holidayDesc !== undefined) {
      return [formatDate(date), dayLabel, ...table.zoneNames.map(() => `Tatil${holidayDesc ? ` — ${holidayDesc}` : ''}`)];
    }
    const cells = table.zoneNames.map((z) => (table.cellMap[date]?.[z] || []).map((e) => e.name).join(' / '));
    return [formatDate(date), dayLabel, ...cells];
  });
  return { header, rows };
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

  if (!entries.length && !adding) {
    return (
      <td className="td-empty">
        <button className="cell-add-btn" onClick={() => setAdding(true)}>+</button>
      </td>
    );
  }

  return (
    <td>
      {entries.map((e) => {
        const color = colorForName(e.name);
        return (
          <div key={e.id} className="cell-person" style={{ background: `#${color}`, color: luminance(color) > 140 ? '#000' : '#fff' }}>
            {e.name}
            {e.isManual && <span title="Elle düzenlendi (kilitli)"><Lock size={11} /></span>}
            <button disabled={busy} onClick={() => handleRemove(e.id)} aria-label="Kaldır"><X size={12} /></button>
          </div>
        );
      })}
      {adding ? (
        <div className="cell-add-row">
          <select value={selectedTeacherId} onChange={(ev) => setSelectedTeacherId(ev.target.value)}>
            <option value="">Öğretmen seç...</option>
            {teacherOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
          <button disabled={busy || !selectedTeacherId} onClick={handleAdd} aria-label="Ekle"><Check size={12} /></button>
          <button disabled={busy} onClick={() => setAdding(false)} aria-label="Vazgeç"><X size={12} /></button>
        </div>
      ) : (
        <button className="cell-add-btn" onClick={() => setAdding(true)}>+</button>
      )}
    </td>
  );
}

export default function Dashboard({
  schoolName,
  initialTeachers,
  initialZones,
  initialRotationMode,
  initialHolidays,
  initialActiveRuleKeys,
  initialSubscription,
  initialPrincipalName,
  initialAssistantPrincipalName,
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ayarlar');
  const { toast, showToast } = useToast();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // ── ÖĞRETMENLER (Personel Yönetimi) ─────────────────────
  const [teachers, setTeachers] = useState(initialTeachers);
  // expandedPanel: 'day' (Gün Kısıtı) | 'zone' (Yer Kısıtı) — aynı anda
  // sadece bir öğretmen için bir panel açık olabilir.
  const [expandedId, setExpandedId] = useState(null);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [expandedMode, setExpandedMode] = useState('ALL');
  const [expandedWeekdays, setExpandedWeekdays] = useState([]);
  const [expandedZoneId, setExpandedZoneId] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [savingZoneRestriction, setSavingZoneRestriction] = useState(false);

  const [inpName, setInpName] = useState('');
  const [inpBranch, setInpBranch] = useState('');
  const [inpDoubleDuty, setInpDoubleDuty] = useState(false);
  const [inpMode, setInpMode] = useState('ALL');
  const [inpWeekdays, setInpWeekdays] = useState([]);
  const [inpFixedZoneId, setInpFixedZoneId] = useState('');
  const [savingTeacher, setSavingTeacher] = useState(false);

  const [teskilatUrl, setTeskilatUrl] = useState('');
  const [fetchingTeskilat, setFetchingTeskilat] = useState(false);

  function toggleInpWeekday(value) {
    setInpWeekdays((days) => (days.includes(value) ? days.filter((d) => d !== value) : [...days, value]));
  }

  async function handleAddTeacher() {
    const full_name = inpName.trim();
    const branch = inpBranch.trim();
    if (!full_name) { showToast('Ad soyad giriniz!', true); return; }
    if (!branch) { showToast('Branş giriniz!', true); return; }
    if (inpMode !== 'ALL' && !inpWeekdays.length) { showToast('Seçili gün(ler) giriniz!', true); return; }

    setSavingTeacher(true);
    const result = await addTeacher({
      full_name,
      branch,
      allow_double_duty: inpDoubleDuty,
      restriction_mode: inpMode,
      fixed_zone_id: inpFixedZoneId || null,
    });

    if (result.error) { setSavingTeacher(false); showToast(result.error, true); return; }

    if (inpMode !== 'ALL') {
      const availResult = await saveTeacherAvailability(result.teacher.id, inpWeekdays);
      if (availResult.error) { setSavingTeacher(false); showToast(availResult.error, true); return; }
    }

    setTeachers((t) => [...t, result.teacher].sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr')));
    setInpName('');
    setInpBranch('');
    setInpDoubleDuty(false);
    setInpMode('ALL');
    setInpWeekdays([]);
    setInpFixedZoneId('');
    setSavingTeacher(false);
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

  async function toggleTeacherDoubleDuty(teacher) {
    const result = await editTeacher(teacher.id, { allow_double_duty: !teacher.allow_double_duty });
    if (result.error) { showToast(result.error, true); return; }
    setTeachers((list) => list.map((t) => (t.id === teacher.id ? result.teacher : t)));
  }

  async function handleRemoveTeacher(teacher) {
    const result = await removeTeacher(teacher.id);
    if (result.error) { showToast(result.error, true); return; }
    setTeachers((list) => list.filter((t) => t.id !== teacher.id));
    if (expandedId === teacher.id) setExpandedId(null);
    showToast(`${teacher.full_name} silindi`);
  }

  async function toggleExpand(teacher, panel) {
    if (expandedId === teacher.id && expandedPanel === panel) { setExpandedId(null); setExpandedPanel(null); return; }
    setExpandedId(teacher.id);
    setExpandedPanel(panel);
    if (panel === 'zone') {
      setExpandedZoneId(teacher.fixed_zone_id || '');
      return;
    }
    setExpandedMode(teacher.restriction_mode);
    if (teacher.restriction_mode === 'ALL') { setExpandedWeekdays([]); return; }
    const result = await fetchTeacherAvailability(teacher.id);
    if (result.error) { showToast(result.error, true); return; }
    setExpandedWeekdays(result.weekdays);
  }

  function toggleExpandedWeekday(value) {
    setExpandedWeekdays((days) => (days.includes(value) ? days.filter((d) => d !== value) : [...days, value]));
  }

  // Gün kısıtı paneli: hem restriction_mode'un kendisini (teachers
  // tablosunda) hem de ONLY/EXCEPT'in hangi günleri kapsadığını (ayrı
  // teacher_unavailable_days tablosu) tek "Kaydet" tuşunda birlikte yazar.
  async function handleSaveDayRestriction(teacher) {
    setSavingAvailability(true);
    const editResult = await editTeacher(teacher.id, { restriction_mode: expandedMode });
    if (editResult.error) { setSavingAvailability(false); showToast(editResult.error, true); return; }

    const daysToSave = expandedMode === 'ALL' ? [] : expandedWeekdays;
    const availResult = await saveTeacherAvailability(teacher.id, daysToSave);
    setSavingAvailability(false);
    if (availResult.error) { showToast(availResult.error, true); return; }

    setTeachers((list) => list.map((t) => (t.id === teacher.id ? editResult.teacher : t)));
    showToast('Gün kısıtı kaydedildi ✓');
    setExpandedId(null);
  }

  // Yer kısıtı: tek sütun (teachers.fixed_zone_id), günlük kısıttan farklı
  // olarak ayrı bir tabloya ihtiyaç yok.
  async function handleSaveZoneRestriction(teacher) {
    setSavingZoneRestriction(true);
    const result = await editTeacher(teacher.id, { fixed_zone_id: expandedZoneId || null });
    setSavingZoneRestriction(false);
    if (result.error) { showToast(result.error, true); return; }
    setTeachers((list) => list.map((t) => (t.id === teacher.id ? result.teacher : t)));
    showToast('Yer kısıtı kaydedildi ✓');
    setExpandedId(null);
  }

  // ── LOKASYONLAR (Nöbet Bölgeleri) ───────────────────────
  const [zones, setZones] = useState(initialZones);
  // Motorun kullandığı GERÇEK rotasyon sırası (öncelik DESC, sonra
  // eklenme tarihi) — bölge listesinde de aynı sırayla gösterilir, "sıra
  // nasıl dönüyor" sorusuna arayüzden cevap versin diye.
  const sortedZonesForDisplay = useMemo(
    () => [...zones].sort((a, b) => (b.priority - a.priority) || a.created_at.localeCompare(b.created_at)),
    [zones]
  );
  const zoneNameById = useMemo(() => Object.fromEntries(zones.map((z) => [z.id, z.name])), [zones]);
  const [inpZoneName, setInpZoneName] = useState('');
  const [inpRequiredCount, setInpRequiredCount] = useState(1);
  const [inpPriority, setInpPriority] = useState(0);
  const [inpActiveDays, setInpActiveDays] = useState([1, 2, 3, 4, 5]);
  const [inpAllowedBranches, setInpAllowedBranches] = useState('');
  const [inpBlockedBranches, setInpBlockedBranches] = useState('');
  const [savingZone, setSavingZone] = useState(false);

  function parseBranchList(text) {
    const items = text.split(',').map((s) => s.trim()).filter(Boolean);
    return items.length ? items : null;
  }

  function toggleInpZoneDay(value) {
    setInpActiveDays((days) => (days.includes(value) ? days.filter((d) => d !== value) : [...days, value]));
  }

  async function handleAddZone() {
    const name = inpZoneName.trim();
    if (!name) { showToast('Bölge adı giriniz!', true); return; }
    if (!inpActiveDays.length) { showToast('En az bir aktif gün seçin!', true); return; }

    const requiredCount = parseInt(inpRequiredCount, 10);
    if (!Number.isInteger(requiredCount) || requiredCount < 1) {
      showToast('Gereken kişi sayısı en az 1 olmalı!', true);
      return;
    }

    setSavingZone(true);
    const result = await addDutyZone({
      name,
      required_count: requiredCount,
      priority: parseInt(inpPriority, 10) || 0,
      active_days: inpActiveDays,
      allowed_branches: parseBranchList(inpAllowedBranches),
      blocked_branches: parseBranchList(inpBlockedBranches),
    });
    setSavingZone(false);

    if (result.error) { showToast(result.error, true); return; }

    setZones((z) => [...z, result.zone].sort((a, b) => (b.priority - a.priority) || a.name.localeCompare(b.name, 'tr')));
    setInpZoneName('');
    setInpRequiredCount(1);
    setInpPriority(0);
    setInpActiveDays([1, 2, 3, 4, 5]);
    setInpAllowedBranches('');
    setInpBlockedBranches('');
    showToast(`${name} eklendi`);
  }

  async function toggleZoneActive(zone) {
    const result = await editDutyZone(zone.id, { is_active: !zone.is_active });
    if (result.error) { showToast(result.error, true); return; }
    setZones((list) => list.map((z) => (z.id === zone.id ? result.zone : z)));
  }

  async function handleRemoveZone(zone) {
    const result = await removeDutyZone(zone.id);
    if (result.error) { showToast(result.error, true); return; }
    setZones((list) => list.filter((z) => z.id !== zone.id));
    showToast(`${zone.name} silindi`);
  }

  // ── PROGRAM TARİHLERİ / DÖNME DÜZENİ / TATİLLER ─────────
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rotationMode, setRotationMode] = useState(initialRotationMode || 'haftalik_yer');
  const [savingMode, setSavingMode] = useState(false);
  const [principalName, setPrincipalName] = useState(initialPrincipalName || '');
  const [savingPrincipal, setSavingPrincipal] = useState(false);
  const [assistantPrincipalName, setAssistantPrincipalName] = useState(initialAssistantPrincipalName || '');
  const [savingAssistantPrincipal, setSavingAssistantPrincipal] = useState(false);
  const [holidays, setHolidays] = useState(initialHolidays || []);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [running, setRunning] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [result, setResult] = useState(null);
  const [rows, setRows] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState(null);
  // Son sorgulanan/oluşturulan aralık — tablo bunu gösterir, tarih
  // girişlerini değiştirip henüz "Oluştur"a basılmamışsa değişmez.
  const [viewedRange, setViewedRange] = useState(null);

  // ── FEATURE GATING (Faz 9) ──────────────────────────────
  // months: son üretilen programın ay listesi + kilit durumu (ay
  // ETİKETLERİ hassas değil, satır verisi değil — bkz. schedule/actions.js).
  const [months, setMonths] = useState([]);
  const [activeMonthKey, setActiveMonthKey] = useState(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [successStats, setSuccessStats] = useState(null);
  const [premiumPrompt, setPremiumPrompt] = useState(null); // 'month' | 'export' | 'history' | 'share' | 'regenerate' | null
  const isPremiumClient = isPremium(initialSubscription);

  const table = useMemo(() => buildScheduleTable(rows, viewedRange, zones), [rows, viewedRange, zones]);
  const weeks = useMemo(() => groupDatesByWeek(table.dates), [table.dates]);
  const holidaysByDate = useMemo(
    () => new Map((holidays || []).map((h) => [h.calendar_date, h.description])),
    [holidays]
  );

  async function loadTeacherOptions() {
    if (teacherOptions) return;
    const res = await fetchTeacherOptions();
    if (!res.error) setTeacherOptions(res.teachers);
  }

  // Elle atama ekleme/silme sonrası aktif görünümü tazeler. Bir ay
  // sekmesi seçiliyse fetchScheduleMonth (kilit kontrolü ay bazında,
  // ücretsiz kullanıcı da kendi açık ayını tazeleyebilmeli); değilse
  // (premium'un serbest aralık görünümü) fetchScheduleView kullanılır.
  async function refreshView() {
    if (!viewedRange) return;
    if (activeMonthKey) {
      const res = await fetchScheduleMonth(activeMonthKey);
      if (!res.error && !res.locked) setRows(res.rows);
      return;
    }
    const res = await fetchScheduleView(viewedRange.start, viewedRange.end);
    if (!res.error && !res.locked) setRows(res.rows);
  }

  async function handleGenerate() {
    if (!startDate || !endDate) { setResult({ error: 'Başlangıç ve bitiş tarihi giriniz.' }); return; }
    if (endDate < startDate) { setResult({ error: 'Bitiş tarihi başlangıçtan önce olamaz.' }); return; }
    if (!teachers.length) { showToast('En az bir öğretmen ekleyin!', true); return; }
    if (!zones.length) { showToast('En az bir bölge ekleyin!', true); return; }

    // Gerçek üretimden önce DB'ye dokunmadan bir önizleme çalıştır —
    // öğretmen sayısı yetersizse hangi (gün, bölge) boş kalacak, idareci
    // "Program Oluştur"a basmadan önce bunu görsün.
    setRunning(true);
    setResult(null);
    const preview = await previewBulkSchedule(startDate, endDate);
    setRunning(false);
    if (preview.error) {
      setResult(preview);
      if (/1 program|Premium/i.test(preview.error)) setPremiumPrompt('regenerate');
      return;
    }

    let confirmMsg =
      `${startDate} – ${endDate} aralığında yeni bir nöbet programı oluşturulacak.\n\n` +
      'Bu aralıktaki, daha önce OTOMATİK oluşturulmuş tüm atamalar SİLİNİP yeniden üretilecek ' +
      '(elle düzenlediğin atamalara dokunulmayacak).';

    if (preview.emptySlots?.length) {
      const lines = preview.emptySlots
        .map((s) => `• ${formatDate(s.date)} (${DAY_TR[getWeekday(s.date)]}) — ${s.zoneName}: ${s.missing} kişi eksik`);
      confirmMsg +=
        `\n\n⚠️ Öğretmen sayısı yetersiz olduğu için şu ${preview.emptySlots.length} yer BOŞ kalacak:\n` +
        lines.join('\n') +
        '\n\nDevam edersen bu yerler boş kalır — sonra elle doldurabilir ya da öğretmenleri çift nöbete işaretleyebilirsin.';
    }
    confirmMsg += '\n\nDevam etmek istiyor musun?';

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    setRunning(true);
    setResult(null);
    const res = await runBulkSchedule(startDate, endDate);
    setRunning(false);
    setResult(res);

    if (res.error) {
      // "1 kez ücretsiz üretim" kısıtı da bu hata mesajıyla döner —
      // ayrıca Premium ekranını da açalım, sadece kırmızı yazı yeterli değil.
      if (/1 program|Premium/i.test(res.error)) setPremiumPrompt('regenerate');
      return;
    }

    const monthsWithLock = (res.months || []).map((m) => ({
      ...m,
      locked: !isPremiumClient && m.key !== res.unlockedMonthKey,
    }));
    const activeMonth = monthsWithLock.find((m) => m.key === res.unlockedMonthKey) || monthsWithLock[0] || null;

    setMonths(monthsWithLock);
    setActiveMonthKey(activeMonth?.key ?? null);
    setRows(res.rows || []);
    setViewedRange(activeMonth ? { start: activeMonth.firstDate, end: activeMonth.lastDate } : { start: startDate, end: endDate });
    loadTeacherOptions();
    setSuccessStats(res.stats || null);
  }

  // Ay sekmesine tıklama — kilitliyse SUNUCUYA HİÇ gitmeden Premium
  // ekranı açılır (gereksiz istek yok, veri zaten client'a gelmemişti).
  async function handleSelectMonth(month) {
    if (month.locked) { setPremiumPrompt('month'); return; }
    setActiveMonthKey(month.key);
    setLoadingMonth(true);
    const res = await fetchScheduleMonth(month.key);
    setLoadingMonth(false);
    if (res.locked) { setPremiumPrompt('month'); return; }
    if (res.error) { showToast(res.error, true); return; }
    setRows(res.rows || []);
    setViewedRange({ start: month.firstDate, end: month.lastDate });
  }

  async function handleView() {
    if (!isPremiumClient) { setPremiumPrompt('history'); return; }
    if (!startDate || !endDate) { setResult({ error: 'Başlangıç ve bitiş tarihi giriniz.' }); return; }
    if (endDate < startDate) { setResult({ error: 'Bitiş tarihi başlangıçtan önce olamaz.' }); return; }

    setViewing(true);
    setResult(null);
    const res = await fetchScheduleView(startDate, endDate);
    setViewing(false);
    if (res.locked) { setPremiumPrompt('history'); return; }
    if (res.error) { setResult(res); return; }
    setMonths([]);
    setActiveMonthKey(null);
    setViewedRange({ start: startDate, end: endDate });
    setRows(res.rows);
    loadTeacherOptions();
    setActiveTab('program');
  }

  async function handleAddHoliday() {
    if (!holidayDate) { showToast('Tatil tarihi giriniz.', true); return; }
    setSavingHoliday(true);
    const res = await addHoliday(holidayDate, holidayDesc);
    setSavingHoliday(false);
    if (res.error) { showToast(res.error, true); return; }
    setHolidays(res.holidays);
    setHolidayDate('');
    setHolidayDesc('');
    showToast(`${formatDate(holidayDate)} tatil olarak eklendi`);
  }

  async function handleRemoveHoliday(id) {
    setSavingHoliday(true);
    const res = await removeHoliday(id);
    setSavingHoliday(false);
    if (res.error) { showToast(res.error, true); return; }
    setHolidays(res.holidays);
  }

  async function handleLoadDefaultHolidays() {
    setSavingHoliday(true);
    const res = await loadDefaultHolidays();
    setSavingHoliday(false);
    if (res.error) { showToast(res.error, true); return; }
    setHolidays(res.holidays);
    showToast('2026-2027 eğitim öğretim yılı tatilleri yüklendi ✓');
  }

  // ── KURALLAR ─────────────────────────────────────────────
  const [activeKeys, setActiveKeys] = useState(new Set(initialActiveRuleKeys));
  const [savingRuleKey, setSavingRuleKey] = useState(null);

  async function handleToggleRule(ruleKey, checked) {
    setSavingRuleKey(ruleKey);
    const res = await toggleRule(ruleKey, checked);
    setSavingRuleKey(null);
    if (res.error) { showToast(res.error, true); return; }
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(ruleKey); else next.delete(ruleKey);
      return next;
    });
    showToast(checked ? 'Kural açıldı' : 'Kural kapatıldı');
  }

  // ── HESABIM ──────────────────────────────────────────────
  const subscriptionStatus = initialSubscription
    ? getSubscriptionStatus({
        status: initialSubscription.status,
        trialEndsAt: initialSubscription.trial_ends_at,
        currentPeriodEnd: initialSubscription.current_period_end,
      })
    : null;
  // ── DAĞILIM (mevcut yüklü program aralığındaki nöbet sayısı) ───
  const distribution = useMemo(() => {
    const counts = {};
    for (const row of rows) {
      const name = row.teachers?.full_name;
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
    const list = Object.entries(counts).map(([name, count]) => ({ name, count }));
    list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'));
    return list;
  }, [rows]);
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  // ── EXPORT ───────────────────────────────────────────────
  function exportCSV() {
    if (!canAccessFeature(initialSubscription, FEATURES.EXPORT_EXCEL)) { setPremiumPrompt('export'); return; }
    if (!table.dates.length) return;
    let csv = 'TARİH,GÜN,' + table.zoneNames.join(',') + '\n';
    table.dates.forEach((date) => {
      const row = [formatDate(date), DAY_TR[getWeekday(date)]];
      table.zoneNames.forEach((z) => {
        const entries = table.cellMap[date]?.[z] || [];
        row.push(entries.map((e) => e.name).join(' / '));
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

  // Resmi MEB tarzı "Öğretmen Nöbet Çizelgesi" belgesi: her hafta ayrı bir
  // tablo (satır=nöbet yeri/bölge, sütun=haftanın günü — kullanıcının
  // örnek belgesiyle birebir aynı yerleşim), altında geçerlilik tarihi,
  // sabit "Nöbetçi Öğretmenin Görevleri" listesi ve okul müdürünün adının
  // otomatik dolduğu imza bloğu. .doc uzantısıyla indirilir — Word bunu
  // doğrudan açar ve TAMAMEN düzenlenebilir (gerçek bir .docx üretmek için
  // ayrı bir kütüphane gerekmez, Word HTML içeriği native olarak okur).
  function exportHTML() {
    if (!canAccessFeature(initialSubscription, FEATURES.EXPORT_WORD)) { setPremiumPrompt('export'); return; }
    if (!table.dates.length) return;
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

    const weekBlocks = weeks
      .map((wk, wi) => {
        const dayHeaderCells = wk
          .map((date) => `<th>${escapeHtml(DAY_TR[getWeekday(date)].toUpperCase())}</th>`)
          .join('');
        const zoneRows = table.zoneNames
          .map((zone) => {
            const cells = wk
              .map((date) => {
                const holidayDesc = holidaysByDate.get(date);
                if (holidayDesc !== undefined) {
                  return `<td class="td-holiday">${escapeHtml(holidayDesc || 'Tatil')}</td>`;
                }
                const entries = table.cellMap[date]?.[zone] || [];
                return `<td>${entries.length ? escapeHtml(entries.map((e) => e.name).join(', ')) : '—'}</td>`;
              })
              .join('');
            return `<tr><td class="td-zone">${escapeHtml(zone)}</td>${cells}</tr>`;
          })
          .join('');

        return `
    <div class="week-block${wi > 0 ? ' page-break' : ''}">
      <table class="sched">
        <thead><tr><th>NÖBET YERİ</th>${dayHeaderCells}</tr></thead>
        <tbody>${zoneRows}</tbody>
      </table>
      <div class="validity">${formatDate(wk[0])} – ${formatDate(wk[wk.length - 1])} tarihleri arası geçerlidir.</div>
    </div>`;
      })
      .join('');

    const rulesList = DUTY_TEACHER_RESPONSIBILITIES.map((r) => `<li>${escapeHtml(r)}</li>`).join('');
    const sigNameHtml = (name) =>
      name
        ? `<div class="sig-name">${escapeHtml(name)}</div>`
        : `<div class="sig-name">.......................................</div>`;

    const html = `<!DOCTYPE html>
<html lang="tr" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Öğretmen Nöbet Çizelgesi</title>
<style>
  @page { size: A4 landscape; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; margin: 0; }
  .doc-header { text-align: center; }
  .doc-header .school-name { font-size: 14pt; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
  .doc-header .doc-title { font-size: 14pt; font-weight: 700; margin-top: 6px; text-transform: uppercase; }
  .week-block { margin-top: 18px; }
  .week-block.page-break { page-break-before: always; }
  table.sched { width: 100%; border-collapse: collapse; font-size: 12pt; }
  table.sched th, table.sched td { border: 1px solid #000; padding: 6px 8px; text-align: center; }
  table.sched th { font-weight: 700; }
  table.sched .td-zone { font-weight: 700; text-align: left; }
  table.sched .td-holiday { font-style: italic; }
  .validity { text-align: center; font-weight: 700; margin: 6px 0 4px; }
  .rules-title { font-weight: 700; text-decoration: underline; margin-top: 16px; }
  .rules-list { margin: 8px 0 0; padding-left: 22px; }
  .rules-list li { margin-bottom: 6px; }
  .signatures { display: flex; justify-content: space-around; margin-top: 40px; page-break-inside: avoid; }
  .signatures .sig-block { width: 42%; text-align: center; }
  .signatures .sig-date { margin-bottom: 46px; }
  .signatures .sig-name { font-weight: 700; }
</style>
</head>
<body>
  <div class="doc-header">
    <div class="school-name">${escapeHtml(schoolName)}</div>
    <div class="doc-title">Öğretmen Nöbet Çizelgesi</div>
  </div>
  ${weekBlocks}
  <div class="rules-title">NÖBETÇİ ÖĞRETMENİN GÖREVLERİ:</div>
  <ol class="rules-list">${rulesList}</ol>
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-date">${todayStr}</div>
      ${sigNameHtml(assistantPrincipalName)}
      <div>Müdür Yardımcısı</div>
    </div>
    <div class="sig-block">
      <div class="sig-date">${todayStr}</div>
      ${sigNameHtml(principalName)}
      <div>Okul Müdürü</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ogretmen_nobet_cizelgesi.doc';
    a.click();
    showToast('Word belgesi indirildi');
  }

  // PDF kütüphanesi (jspdf + jspdf-autotable) sadece tıklanınca dinamik
  // import edilir — sayfa ilk yüklemesini şişirmesin.
  async function exportPDF() {
    if (!canAccessFeature(initialSubscription, FEATURES.EXPORT_PDF)) { setPremiumPrompt('export'); return; }
    if (!table.dates.length) return;
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const { header, rows: gridRows } = buildExportGrid(table, holidaysByDate);
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(12);
    doc.text(schoolName, 14, 12);
    autoTable(doc, { head: [header], body: gridRows, startY: 18, styles: { fontSize: 8 } });
    doc.save('nobet_programi.pdf');
    showToast('PDF indirildi');
  }

  // Gerçek bir .xlsx (OOXML/zip) üretmek ek bir kütüphane (xlsx/exceljs)
  // gerektiriyordu; ikisi de bilinen güvenlik açığı taşıyan eski/vulnerable
  // transitive bağımlılıklar getiriyordu (npm audit: xlsx'te düzeltmesi
  // olmayan prototype pollution/ReDoS, exceljs'in archiver zincirinde
  // yüksek önem dereceli DoS). Bunun yerine exportHTML (Word) ile AYNI
  // kanıtlanmış teknik kullanılıyor: Excel, HTML tablosunu native olarak
  // açabiliyor — .xls uzantısı + application/vnd.ms-excel MIME yeterli,
  // yeni bağımlılık/güvenlik yüzeyi eklemeden aynı sonucu verir (CLAUDE.md
  // "iki çözümden basit olanı seç" kuralına uygun, bilinçli karar).
  function exportExcel() {
    if (!canAccessFeature(initialSubscription, FEATURES.EXPORT_EXCEL)) { setPremiumPrompt('export'); return; }
    if (!table.dates.length) return;
    const { header, rows: gridRows } = buildExportGrid(table, holidaysByDate);
    const theadHtml = `<tr>${header.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    const tbodyHtml = gridRows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>` +
      `<body><table border="1"><thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table></body></html>`;
    const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nobet_programi.xls';
    a.click();
    showToast('Excel indirildi');
  }

  // Ctrl+P ile tarayıcı-native yazdırmayı tam engellemek mümkün değil —
  // bu buton ana yol, @media print CSS'i (dashboard.css) sadece tabloyu
  // gösterir. Bilinçli sınır, bkz. PHASE_REPORT.md "kapsam dışı".
  function printSchedule() {
    if (!canAccessFeature(initialSubscription, FEATURES.PRINT)) { setPremiumPrompt('export'); return; }
    if (!table.dates.length) return;
    window.print();
  }

  const [sharingBusy, setSharingBusy] = useState(false);
  async function handleShare() {
    if (!canAccessFeature(initialSubscription, FEATURES.SHARE_SCHEDULE)) { setPremiumPrompt('share'); return; }
    if (!viewedRange) return;
    setSharingBusy(true);
    const res = await createShareLink(viewedRange.start, viewedRange.end);
    setSharingBusy(false);
    if (res.locked) { setPremiumPrompt('share'); return; }
    if (res.error) { showToast(res.error, true); return; }
    const url = `${window.location.origin}/share/${res.token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Paylaşım bağlantısı kopyalandı');
    } catch {
      window.prompt('Paylaşım bağlantısı:', url);
    }
  }

  async function handleRemoveShare() {
    setSharingBusy(true);
    await removeShareLink();
    setSharingBusy(false);
    showToast('Paylaşım bağlantısı kaldırıldı');
  }

  const sortedHolidayDates = useMemo(
    () => [...(holidays || [])].sort((a, b) => a.calendar_date.localeCompare(b.calendar_date)),
    [holidays]
  );

  return (
    <div className="dash-root">
      <header>
        <div className="logo"><Logo size={26} /><span>OkulNöbet</span></div>
        <Badge variant="primary">OTOMATİK</Badge>
        <div className="school-name">{schoolName}</div>
        <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
      </header>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'ayarlar' ? 'active' : ''}`} onClick={() => setActiveTab('ayarlar')}><Settings size={15} /> Ayarlar</button>
        <button className={`tab-btn ${activeTab === 'program' ? 'active' : ''}`} onClick={() => setActiveTab('program')}><Calendar size={15} /> Program</button>
        <button className={`tab-btn ${activeTab === 'dagitim' ? 'active' : ''}`} onClick={() => setActiveTab('dagitim')}><BarChart3 size={15} /> Dağılım</button>
      </div>

      {/* ═══════ TAB: AYARLAR ═══════ */}
      <div className={`tab-content ${activeTab === 'ayarlar' ? 'active' : ''}`}>
        <div className="two-col">
          <div>
            <div className="card">
              <h3><User size={17} /> Personel Yönetimi</h3>
              <div className="info-box">Kişi ekle/sil → bir sonraki program üretiminde otomatik uygulanır.</div>

              <div className="form-row">
                <div>
                  <label>Ad Soyad</label>
                  <input type="text" placeholder="AYŞE YILMAZ" value={inpName} onChange={(e) => setInpName(e.target.value)} />
                </div>
                <div>
                  <label>Branş</label>
                  <input type="text" placeholder="Sınıf öğretmeni" value={inpBranch} onChange={(e) => setInpBranch(e.target.value)} />
                </div>
                <div style={{ alignSelf: 'end' }}>
                  <button className="btn btn-primary" onClick={handleAddTeacher} disabled={savingTeacher}>+ Ekle</button>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label>Gün Kısıtı</label>
                  <select value={inpMode} onChange={(e) => { setInpMode(e.target.value); setInpWeekdays([]); }}>
                    {Object.entries(RESTRICTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Yer Kısıtı</label>
                  <select value={inpFixedZoneId} onChange={(e) => setInpFixedZoneId(e.target.value)}>
                    <option value="">Kısıt yok</option>
                    {sortedZonesForDisplay.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {inpMode !== 'ALL' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {WEEKDAYS.map((d) => (
                    <label key={d.value} className={`wdcheck ${inpWeekdays.includes(d.value) ? 'active' : ''}`}>
                      <input type="checkbox" checked={inpWeekdays.includes(d.value)} onChange={() => toggleInpWeekday(d.value)} /> {d.label}
                    </label>
                  ))}
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'none', fontSize: 12, color: 'var(--muted)', marginBottom: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={inpDoubleDuty} onChange={(e) => setInpDoubleDuty(e.target.checked)} style={{ width: 'auto' }} />
                Gerekirse çift nöbet tutabilir (haftada 2. bir nöbet günü)
              </label>

              <div className="person-list">
                {teachers.map((t) => (
                  <Fragment key={t.id}>
                    <div className="person-item" style={t.is_active ? undefined : { opacity: 0.5 }}>
                      <div className="person-color" style={{ background: `#${colorForName(t.full_name)}` }} />
                      <span className="person-name">{t.full_name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({t.branch})</span></span>
                      <span className="person-tag" style={{ background: 'var(--border)', color: 'var(--muted)' }}>{RESTRICTION_LABELS[t.restriction_mode]}</span>
                      {t.fixed_zone_id && (
                        <span className="person-tag" style={{ background: 'var(--border)', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={10} /> {zoneNameById[t.fixed_zone_id] || '—'}
                        </span>
                      )}
                      <button
                        className={`person-tag ${t.allow_double_duty ? 'tag-new' : ''}`}
                        style={!t.allow_double_duty ? { background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' } : { cursor: 'pointer', border: 'none' }}
                        title="Gerekirse çift nöbet tutabilir"
                        onClick={() => toggleTeacherDoubleDuty(t)}
                      >
                        2×
                      </button>
                      <button className="person-tag" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => toggleExpand(t, 'day')}>
                        {expandedId === t.id && expandedPanel === 'day' ? 'Kapat' : 'Gün Kısıtı'}
                      </button>
                      <button className="person-tag" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => toggleExpand(t, 'zone')}>
                        {expandedId === t.id && expandedPanel === 'zone' ? 'Kapat' : 'Yer Kısıtı'}
                      </button>
                      <button className="person-del" onClick={() => handleRemoveTeacher(t)} aria-label="Öğretmeni sil"><X size={14} /></button>
                    </div>
                    {expandedId === t.id && expandedPanel === 'day' && (
                      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginTop: -2 }}>
                        <label style={{ marginBottom: 6 }}>Kısıt Türü</label>
                        <select
                          value={expandedMode}
                          onChange={(e) => { setExpandedMode(e.target.value); setExpandedWeekdays([]); }}
                          style={{ marginBottom: 10 }}
                        >
                          {Object.entries(RESTRICTION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        {expandedMode !== 'ALL' && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            {WEEKDAYS.map((d) => (
                              <label key={d.value} className={`wdcheck ${expandedWeekdays.includes(d.value) ? 'active' : ''}`}>
                                <input type="checkbox" checked={expandedWeekdays.includes(d.value)} onChange={() => toggleExpandedWeekday(d.value)} /> {d.label}
                              </label>
                            ))}
                          </div>
                        )}
                        <button className="btn btn-primary" onClick={() => handleSaveDayRestriction(t)} disabled={savingAvailability}>
                          Kaydet
                        </button>
                      </div>
                    )}
                    {expandedId === t.id && expandedPanel === 'zone' && (
                      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginTop: -2 }}>
                        <label style={{ marginBottom: 6 }}>Sabit Nöbet Yeri</label>
                        <select value={expandedZoneId} onChange={(e) => setExpandedZoneId(e.target.value)} style={{ marginBottom: 10 }}>
                          <option value="">Kısıt yok (döngüye göre değişir)</option>
                          {sortedZonesForDisplay.map((z) => (
                            <option key={z.id} value={z.id}>{z.name}</option>
                          ))}
                        </select>
                        <div className="info-box" style={{ marginBottom: 10, fontSize: 11 }}>
                          <Lightbulb size={13} />
                          <span>Bu öğretmen artık döngüye katılmaz, her zaman SADECE bu nöbet yerinde görevlendirilir. Hangi günde görevlendirileceği, ayrıca bir gün kısıtı belirlenmediyse değişebilir.</span>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleSaveZoneRestriction(t)} disabled={savingZoneRestriction}>
                          Kaydet
                        </button>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>

              <div className="sep" />
              <div className="info-box" style={{ marginBottom: 0 }}>
                <Lightbulb size={13} />
                <div style={{ flex: 1 }}>
                  Okulunun MEB web sitesindeki teşkilat şeması adresini gir, sınıf ve branş öğretmenlerini otomatik çeksin (müdür, müdür yardımcıları, rehber ve anaokulu öğretmenleri hariç tutulur):
                  <input
                    type="text"
                    placeholder="https://okulunuz.meb.k12.tr/tema/teskilat_semasi.html"
                    value={teskilatUrl}
                    onChange={(e) => setTeskilatUrl(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                  <button className="btn btn-outline" style={{ marginTop: 8, width: '100%' }} onClick={handleFetchTeskilat} disabled={fetchingTeskilat}>
                    {fetchingTeskilat ? 'Çekiliyor...' : <><Users size={14} /> Teşkilat Şemasından Öğretmenleri Çek</>}
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h3><School size={17} /> Nöbet Yerleri</h3>
              <div className="form-row-3">
                <div>
                  <label>Bölge Adı</label>
                  <input type="text" placeholder="B BLOK" value={inpZoneName} onChange={(e) => setInpZoneName(e.target.value)} />
                </div>
                <div>
                  <label>Kişi Sayısı</label>
                  <input type="number" min="1" max="20" value={inpRequiredCount} onChange={(e) => setInpRequiredCount(e.target.value)} />
                </div>
                <div>
                  <label>Öncelik</label>
                  <input type="number" value={inpPriority} onChange={(e) => setInpPriority(e.target.value)} />
                </div>
                <div style={{ alignSelf: 'end' }}>
                  <button className="btn btn-primary" onClick={handleAddZone} disabled={savingZone}>+ Ekle</button>
                </div>
              </div>

              <div className="info-box">
                <Lightbulb size={13} />
                <span><strong>Sıra nasıl döner?</strong> Nöbet her hafta bu listedeki bir SONRAKİ bölgeye kayar (son bölgedeki bir sonraki hafta ilk bölgeye/güne geçer). Liste sırası önce <strong>Öncelik</strong>&apos;e göre belirlenir (büyük sayı önce gelir), Öncelik eşitse bölgenin eklenme tarihine göre. Sırayı elle kontrol etmek istemiyorsan Öncelik&apos;i 0 bırak — bölgeler eklenme sırasıyla dizilir. Aşağıdaki listede her bölgenin yanında güncel sırası (#1, #2, ...) gösterilir.</span>
              </div>

              <label>Aktif Günler</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {WEEKDAYS.map((d) => (
                  <label key={d.value} className={`wdcheck ${inpActiveDays.includes(d.value) ? 'active' : ''}`}>
                    <input type="checkbox" checked={inpActiveDays.includes(d.value)} onChange={() => toggleInpZoneDay(d.value)} /> {d.label}
                  </label>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label>İzinli Branşlar (virgülle, boş = herkes)</label>
                  <input type="text" placeholder="sınıf, beden eğitimi" value={inpAllowedBranches} onChange={(e) => setInpAllowedBranches(e.target.value)} />
                </div>
                <div>
                  <label>Yasaklı Branşlar (virgülle, boş = kısıt yok)</label>
                  <input type="text" placeholder="okul öncesi" value={inpBlockedBranches} onChange={(e) => setInpBlockedBranches(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {sortedZonesForDisplay.map((z, i) => (
                  <div key={z.id} style={{ background: '#1a5276', border: '1px solid #375623', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', opacity: z.is_active ? 1 : 0.5 }}>
                    <span style={{ background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>Sıra #{i + 1}</span>
                    {z.name} <span style={{ fontWeight: 400 }}>({z.required_count} kişi, öncelik {z.priority})</span>
                    <button onClick={() => toggleZoneActive(z)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}>
                      {z.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                    <button onClick={() => handleRemoveZone(z)} aria-label="Bölgeyi sil" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0 2px', display: 'inline-flex', alignItems: 'center' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <h3><CalendarDays size={17} /> Program Tarihleri</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div><label>Başlangıç</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                <div><label>Bitiş</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              </div>
              <div className="info-box" style={{ marginBottom: 0, background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
                <span>Program Oluştur, seçili aralıktaki <strong>otomatik oluşturulmuş</strong> atamaları siler ve baştan üretir. Elle düzenlediğin (kilitli) atamalara dokunulmaz. Hafta sonları ve resmi tatiller otomatik atlanır.</span>
              </div>
            </div>

            <div className="card">
              <h3><Flag size={17} /> Resmi Tatiller & İstisna Günler</h3>
              <div className="form-row">
                <div><label>Tarih</label><input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} /></div>
                <div><label>Açıklama</label><input type="text" placeholder="Cumhuriyet Bayramı" value={holidayDesc} onChange={(e) => setHolidayDesc(e.target.value)} /></div>
                <div style={{ alignSelf: 'end' }}><button className="btn btn-danger" onClick={handleAddHoliday} disabled={savingHoliday}>+ Ekle</button></div>
              </div>
              <div className="holiday-list">
                {sortedHolidayDates.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>Henüz tatil eklenmedi</div>
                )}
                {sortedHolidayDates.map((h) => (
                  <div className="holiday-tag" key={h.id}>
                    <CalendarDays size={12} /> {formatDate(h.calendar_date)} – {h.description || 'Tatil'}
                    <button disabled={savingHoliday} onClick={() => handleRemoveHoliday(h.id)} aria-label="Kaldır"><X size={12} /></button>
                  </div>
                ))}
              </div>

              <div className="sep" />
              <div className="info-box" style={{ marginBottom: 0 }}>
                <Lightbulb size={13} />
                <div style={{ flex: 1 }}>
                  2026-2027 eğitim öğretim yılı resmi tatillerini otomatik yükle:
                  <button className="btn btn-outline" style={{ marginTop: 8, width: '100%' }} onClick={handleLoadDefaultHolidays} disabled={savingHoliday}>
                    <Flag size={14} /> 2026-2027 Eğitim Öğretim Yılı Tatillerini Yükle
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h3><Scale size={17} /> Dağıtım Ayarları</h3>
              <div>
                <label>Dönme Düzeni</label>
                <select
                  value={rotationMode}
                  disabled={savingMode}
                  onChange={async (e) => {
                    const mode = e.target.value;
                    const previous = rotationMode;
                    setRotationMode(mode);
                    setSavingMode(true);
                    const res = await updateRotationMode(mode);
                    setSavingMode(false);
                    if (res.error) { setRotationMode(previous); showToast(res.error, true); }
                  }}
                >
                  {Object.entries(ROTATION_MODE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="info-box" style={{ marginTop: 10, marginBottom: 0 }}>
                <Lightbulb size={13} />
                <span>
                  {ROTATION_MODE_DESCRIPTIONS[rotationMode]}
                  <br /><br />
                  Tatil ve okulun kapalı olduğu dönemlerde sıra İLERLEMEZ, kaldığı yerden devam eder.
                </span>
              </div>
            </div>

            <div className="card">
              <h3><School size={17} /> Okul Bilgileri</h3>
              <div>
                <label>Okul Müdürü Adı Soyadı</label>
                <input
                  type="text"
                  value={principalName}
                  disabled={savingPrincipal}
                  placeholder="Örn. Ahmet Yılmaz"
                  onChange={(e) => setPrincipalName(e.target.value)}
                  onBlur={async (e) => {
                    const name = e.target.value.trim();
                    setSavingPrincipal(true);
                    const res = await updateSchoolPrincipalName(name);
                    setSavingPrincipal(false);
                    if (res.error) showToast(res.error, true);
                    else showToast('Okul müdürü kaydedildi ✓');
                  }}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <label>Müdür Yardımcısı Adı Soyadı</label>
                <input
                  type="text"
                  value={assistantPrincipalName}
                  disabled={savingAssistantPrincipal}
                  placeholder="Örn. Ayşe Kaya"
                  onChange={(e) => setAssistantPrincipalName(e.target.value)}
                  onBlur={async (e) => {
                    const name = e.target.value.trim();
                    setSavingAssistantPrincipal(true);
                    const res = await updateSchoolAssistantPrincipalName(name);
                    setSavingAssistantPrincipal(false);
                    if (res.error) showToast(res.error, true);
                    else showToast('Müdür yardımcısı kaydedildi ✓');
                  }}
                />
              </div>
              <div className="info-box" style={{ marginTop: 10, marginBottom: 0 }}>
                <Lightbulb size={13} />
                <span>Resmi nöbet çizelgesi çıktısında imza bloğuna otomatik yazılır.</span>
              </div>
            </div>

            <div className="card">
              <h3><Puzzle size={17} /> Kurallar</h3>
              <div className="info-box">
                Program otomatik oluşturulurken her atamada kontrol edilir. Kapatırsan o kural artık kimseyi elemez.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {HARD_RULE_KEYS.map((key) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', textTransform: 'none' }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto', marginTop: 3 }}
                      checked={activeKeys.has(key)}
                      disabled={savingRuleKey === key}
                      onChange={(e) => handleToggleRule(key, e.target.checked)}
                    />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{HARD_RULE_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <h3><Crown size={17} /> Hesabım</h3>
              {!subscriptionStatus ? (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Abonelik bilgisi bulunamadı.</div>
              ) : (
                <div className="person-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, background: isPremiumClient ? 'var(--success)' : 'var(--warning)', color: isPremiumClient ? '#0f2e1a' : '#3a2c00', marginBottom: 8 }}>
                  {isPremiumClient ? <><Check size={12} /> Premium Aktif</> : subscriptionStatus.label}
                </div>
              )}

              <div className="sep" />
              {isPremiumClient ? (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Tüm dönem, dışa aktarma, paylaşım ve geçmiş kayıtlar açık. Teşekkürler!
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                    Ücretsiz planda ilk ay görüntülenebilir. Standart plan ile tüm dönem, dışa aktarma ve paylaşım açılır:
                  </div>
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Standart</div>
                    <div style={{ fontSize: 20, fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--primary)' }}>{formatTL(STANDARD_YEARLY_PRICE)} <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'inherit', fontWeight: 400 }}>/ yıl</span></div>
                  </div>
                  <button className="btn btn-success" style={{ width: '100%', marginBottom: 10 }} onClick={() => setPremiumPrompt('account')}>Premium'a Geç</button>
                </>
              )}
              <div className="info-box" style={{ marginBottom: 0 }}>
                <Lightbulb size={13} />
                <span>
                  Tüm planları görmek için{' '}
                  <a href="/fiyatlandirma" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-hover)' }}>fiyatlandırma sayfasına</a> bakabilirsin.
                </span>
              </div>
            </div>

            <button className="btn btn-success btn-xl" onClick={handleGenerate} disabled={running || viewing}>
              {running ? 'Oluşturuluyor...' : <><Sparkles size={16} /> PROGRAM OLUŞTUR</>}
            </button>
            <button className="btn btn-outline" style={{ width: '100%', marginTop: 10 }} onClick={handleView} disabled={running || viewing}>
              {viewing ? 'Yükleniyor...' : <><Eye size={16} /> Mevcut Aralığı Görüntüle</>}
            </button>
            {result?.error && <div className="holiday-tag" style={{ marginTop: 10 }}>{result.error}</div>}
          </div>
        </div>
      </div>

      {/* ═══════ TAB: PROGRAM ═══════ */}
      <div className={`tab-content ${activeTab === 'program' ? 'active' : ''}`}>
        {!viewedRange ? (
          <EmptyState
            icon={<Calendar size={40} />}
            title="Henüz program oluşturulmadı"
            subtitle="Ayarlar sekmesinden personel, bölge ve tarihleri belirleyin"
          />
        ) : (
          <div>
            {months.length > 0 && (
              <div className="month-tabs">
                {months.map((m) => (
                  <button
                    key={m.key}
                    className={`month-tab-btn ${activeMonthKey === m.key ? 'active' : ''} ${m.locked ? 'locked' : ''}`}
                    onClick={() => handleSelectMonth(m)}
                    disabled={loadingMonth && activeMonthKey === m.key}
                  >
                    {m.label}{m.locked ? <Lock size={11} style={{ marginLeft: 4, verticalAlign: -1 }} /> : ''}
                  </button>
                ))}
              </div>
            )}
            <div className="stats-grid">
              <div className="stat-card"><span className="stat-icon"><Calendar size={20} /></span><div><div className="stat-num">{table.dates.filter((d) => !holidaysByDate.has(d)).length}</div><div className="stat-lbl">Aktif Gün</div></div></div>
              <div className="stat-card"><span className="stat-icon"><Users size={20} /></span><div><div className="stat-num">{teachers.length}</div><div className="stat-lbl">Personel</div></div></div>
              <div className="stat-card"><span className="stat-icon"><School size={20} /></span><div><div className="stat-num">{zones.length}</div><div className="stat-lbl">Nöbet Yeri</div></div></div>
              <div className="stat-card"><span className="stat-icon"><CheckCircle2 size={20} /></span><div><div className="stat-num">{rows.length}</div><div className="stat-lbl">Toplam Nöbet</div></div></div>
            </div>
            <div className="schedule-wrapper printable-schedule">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>TARİH</th>
                    <th>GÜN</th>
                    {table.zoneNames.map((z) => <th key={z}>{z}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((wk, wi) => (
                    <Fragment key={`w-${wi}`}>
                      <tr className="week-header">
                        <td colSpan={2 + table.zoneNames.length}>
                          HAFTA {wi + 1} ({formatDate(wk[0])} – {formatDate(wk[wk.length - 1])})
                        </td>
                      </tr>
                      {wk.map((date) => {
                        const holidayDesc = holidaysByDate.get(date);
                        return (
                          <tr key={date}>
                            <td className="td-date">{formatDate(date)}</td>
                            <td className="td-day">{DAY_TR[getWeekday(date)]}</td>
                            {holidayDesc !== undefined ? (
                              <td className="td-holiday" colSpan={table.zoneNames.length}>
                                <Flag size={11} style={{ verticalAlign: -1 }} /> {holidayDesc || 'Tatil'} — KAPALI
                              </td>
                            ) : (
                              table.zoneNames.map((z) => (
                                <ScheduleCell
                                  key={z}
                                  date={date}
                                  zoneId={table.zoneIdByName.get(z)}
                                  entries={table.cellMap[date]?.[z] || []}
                                  teacherOptions={teacherOptions || []}
                                  onRefresh={refreshView}
                                />
                              ))
                            )}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="export-section">
              <button className="btn btn-primary btn-lg" onClick={exportCSV}>{isPremiumClient ? <Download size={15} /> : <Lock size={15} />} CSV İndir</button>
              <button className="btn btn-outline btn-lg" onClick={exportHTML}>{isPremiumClient ? <FileText size={15} /> : <Lock size={15} />} Word İndir</button>
              <button className="btn btn-outline btn-lg" onClick={exportPDF}>{isPremiumClient ? <FileText size={15} /> : <Lock size={15} />} PDF İndir</button>
              <button className="btn btn-outline btn-lg" onClick={exportExcel}>{isPremiumClient ? <BarChart3 size={15} /> : <Lock size={15} />} Excel İndir</button>
              <button className="btn btn-outline btn-lg" onClick={printSchedule}>{isPremiumClient ? <Printer size={15} /> : <Lock size={15} />} Yazdır</button>
              <button className="btn btn-outline btn-lg" onClick={handleShare} disabled={sharingBusy}>{isPremiumClient ? <Link2 size={15} /> : <Lock size={15} />} Paylaş</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ TAB: DAĞILIM ═══════ */}
      <div className={`tab-content ${activeTab === 'dagitim' ? 'active' : ''}`}>
        {!distribution.length ? (
          <EmptyState icon={<BarChart3 size={40} />} title="Program henüz oluşturulmadı" />
        ) : (
          <div className="card">
            <h3><BarChart3 size={17} /> Kişi Başı Nöbet Dağılımı (görüntülenen aralık)</h3>
            <table className="distrib-table">
              <thead>
                <tr><th>Renk</th><th>Ad Soyad</th><th>Nöbet Sayısı</th><th>Dağılım</th></tr>
              </thead>
              <tbody>
                {distribution.map((p) => {
                  const pct = Math.round((p.count / maxCount) * 100);
                  const color = colorForName(p.name);
                  return (
                    <tr key={p.name}>
                      <td><div className="person-color" style={{ background: `#${color}`, margin: 'auto' }} /></td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{p.count}</td>
                      <td><div className="distrib-bar-wrap"><div className="distrib-bar" style={{ width: `${pct}%`, background: `#${color}` }} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toast={toast} />

      <AnimatePresence>
        {successStats && (
          <SuccessScreen
            stats={successStats}
            onContinue={() => { setSuccessStats(null); setActiveTab('program'); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {premiumPrompt && <PremiumScreen reason={premiumPrompt} onClose={() => setPremiumPrompt(null)} />}
      </AnimatePresence>
    </div>
  );
}

// Program üretimi bittikten hemen sonra gösterilen başarı ekranı —
// gerçek verilerden hesaplanan 7 metrik (bkz. lib/db/bulkSchedule.js
// stats, lib/engine/fairness.js). Tek kullanım yeri burası, ayrı
// dosyaya çıkarmaya gerek yok (CLAUDE.md YAGNI).
function SuccessScreen({ stats, onContinue }) {
  const items = [
    { icon: CheckCircle2, label: 'Toplam Nöbet', value: stats.totalDutyCount },
    { icon: Users, label: 'Öğretmen Sayısı', value: stats.teacherCount },
    { icon: School, label: 'Nöbet Alanı', value: stats.zoneCount },
    { icon: AlertTriangle, label: 'Boş Kalan Yer', value: stats.conflictCount },
    { icon: Scale, label: 'Adalet Puanı', value: `${stats.fairnessScore}/100` },
    { icon: Timer, label: 'Oluşturma Süresi', value: `${(stats.durationMs / 1000).toFixed(1)} sn` },
    { icon: Lightbulb, label: 'Tahmini Zaman Tasarrufu', value: `${Math.round(stats.estimatedMinutesSaved / 60)} saat` },
  ];

  return (
    <Modal onClose={onContinue} labelledBy="success-screen-title" maxWidth={460}>
      <div style={{ textAlign: 'center' }}>
        <PartyPopper size={36} color="var(--primary)" style={{ marginBottom: 8 }} />
        <h2 id="success-screen-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, margin: 0 }}>Program başarıyla oluşturuldu</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0', textAlign: 'left' }}>
          {items.map((it) => (
            <div key={it.label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><it.icon size={12} /> {it.label}</div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--primary)' }}>{it.value}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-success btn-xl" style={{ width: '100%' }} onClick={onContinue}>Devam Et</button>
      </div>
    </Modal>
  );
}
