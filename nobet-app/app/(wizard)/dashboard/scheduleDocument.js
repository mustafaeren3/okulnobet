// Resmi "Öğretmen Nöbet Çizelgesi" belgesinin TEK HTML üretici fonksiyonu.
// Hem Word indirme (Dashboard.jsx exportHTML) hem Yazdır (printSchedule)
// AYNI bu fonksiyonu çağırır — kullanıcı isteği: ekrandaki program değil,
// resmi Word çıktısıyla birebir aynı belge yazdırılsın, iki farklı çıktı
// oluşmasın. Dependency'siz düz JS (lib/engine/ değil — HTML string
// şablonlama iş kuralı değil doküman detayı, engine saflığı gerekmiyor).

import { DAY_TR, getWeekday } from '@/lib/engine/weekday';
import { formatDate } from './colorUtils';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

// weeks: table.dates'in haftalara gruplanmış hali (bkz. groupDatesByWeek).
// table: buildScheduleTable çıktısı. holidaysByDate: Map<date, description>.
// assistantPrincipalColumnMode: 'same_table' | 'separate_table'.
// assistantPrincipalRowsByDate: Map<date, personFullName> — boşsa (modül
// hiç kullanılmıyorsa) ne ek sütun ne ek tablo eklenir, mevcut belge
// AYNEN üretilir (geriye dönük uyumlu).
export function buildScheduleDocumentHtml({
  schoolName,
  weeks,
  table,
  holidaysByDate,
  principalName,
  assistantPrincipalName,
  todayStr,
  assistantPrincipalColumnMode = 'same_table',
  assistantPrincipalRowsByDate,
}) {
  const hasApColumn = assistantPrincipalRowsByDate && assistantPrincipalRowsByDate.size > 0;
  const showApAsColumn = hasApColumn && assistantPrincipalColumnMode === 'same_table';
  const showApAsSeparateTable = hasApColumn && assistantPrincipalColumnMode === 'separate_table';

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

      const apRow = showApAsColumn
        ? `<tr><td class="td-zone">GÖREVLİ MÜDÜR YARDIMCISI</td>${wk
            .map((date) => {
              const holidayDesc = holidaysByDate.get(date);
              if (holidayDesc !== undefined) return `<td class="td-holiday">${escapeHtml(holidayDesc || 'Tatil')}</td>`;
              const name = assistantPrincipalRowsByDate.get(date);
              return `<td>${name ? escapeHtml(name) : '—'}</td>`;
            })
            .join('')}</tr>`
        : '';

      return `
    <div class="week-block${wi > 0 ? ' page-break' : ''}">
      <table class="sched">
        <thead><tr><th>NÖBET YERİ</th>${dayHeaderCells}</tr></thead>
        <tbody>${zoneRows}${apRow}</tbody>
      </table>
      <div class="validity">${formatDate(wk[0])} – ${formatDate(wk[wk.length - 1])} tarihleri arası geçerlidir.</div>
    </div>`;
    })
    .join('');

  const apSeparateTableHtml = showApAsSeparateTable
    ? `
  <div class="ap-doc-title">GÖREVLİ MÜDÜR YARDIMCISI ÇİZELGESİ</div>
  <table class="sched ap-sched">
    <thead><tr><th>TARİH</th><th>GÜN</th><th>GÖREVLİ MÜDÜR YARDIMCISI</th></tr></thead>
    <tbody>${table.dates
      .map((date) => {
        const holidayDesc = holidaysByDate.get(date);
        const name = holidayDesc !== undefined ? (holidayDesc || 'Tatil') : assistantPrincipalRowsByDate.get(date) || '—';
        return `<tr><td>${formatDate(date)}</td><td>${escapeHtml(DAY_TR[getWeekday(date)])}</td><td>${escapeHtml(name)}</td></tr>`;
      })
      .join('')}</tbody>
  </table>`
    : '';

  const rulesList = DUTY_TEACHER_RESPONSIBILITIES.map((r) => `<li>${escapeHtml(r)}</li>`).join('');
  const sigNameHtml = (name) =>
    name
      ? `<div class="sig-name">${escapeHtml(name)}</div>`
      : `<div class="sig-name">.......................................</div>`;

  return `<!DOCTYPE html>
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
  .ap-doc-title { font-weight: 700; text-align: center; margin-top: 26px; text-transform: uppercase; }
  .ap-sched { margin-top: 10px; }
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
  ${apSeparateTableHtml}
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
}
