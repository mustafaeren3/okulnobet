// Scheduling Engine'in toplu üretim ucu. Bir tarih aralığı + okuldaki
// tüm aktif bölgeler için otomatik atama üretir.
//
// Dönme düzeni (schools.rotation_mode, kullanıcının ürün tanımı):
// * haftalik_yer: her hafta bölge +1 ileri; hücreler gün-öncelikli tek
//   döngü olduğu için bölge listesi sarınca GÜN de +1 ilerler
//   (Pzt zemin → Pzt 1.kat → ... → Pzt son bölge → Sal zemin → ...).
// * aylik_ayni_gun: her takvim ayında bölge +1, gün sabit.
// * aylik_farkli_gun: her takvim ayında bölge +1 VE gün +1.
//
// Sıra durumu için kalıcı cursor YOK — düzen, DB'deki son üretilmiş
// hafta/aydan (çapa) türetilir. Tatil/kapalı dönemler SAYILMAZ: sadece
// işlenebilir (en az bir okul günü olan) hafta/aylar sırayı ilerletir —
// "tatildeyken sıra dönmez, kaldığı yerden devam eder". Aynı aralığı
// tekrar üretmek aynı sonucu verir; aralığı uzatmak sırayı bozmaz.
//
// Sırası gelen öğretmen o gün uygun değilse (izin/kapalı bölge/kural)
// hücre adillikle doldurulur ama DESEN bozulmaz — ertesi hafta öğretmen
// kendi sırasındaki yerde. Desende hiç sahibi olmayan hücreler (okulda
// hücreden az öğretmen desene girmişse) adillik doldurmasıyla dolar ve
// dolduran öğretmen desene katılır (bir sonraki adımda onlarla birlikte
// döner). is_manual satırlar silinmez ve kapasiteden düşülür.

import { getTeachers } from './teachers';
import { getDutyZones } from './dutyZones';
import { getUnavailableWeekdaysForTeachers } from './teacherAvailability';
import { getZoneClosuresForZones } from './zoneClosures';
import { getCalendarDays } from './calendarDays';
import { getActiveHardRuleKeys } from './rules';
import { requireUsableSubscription } from './subscriptions';
import { getSchoolRotationMode } from './schoolContext';
import {
  deleteAutoAssignmentsInRange,
  createAssignments,
  getTotalAssignmentCounts,
  getAssignmentsForRange,
  getLatestAssignmentDateBefore,
} from './dutyAssignments';
import { checkHardRules } from '@/lib/engine/rules';
import { getWeekday } from '@/lib/engine/weekday';
import { selectFairest } from '@/lib/engine/selectFairest';
import { eachDateStr, isSchedulableDay } from '@/lib/engine/scheduler';
import {
  getWeekStart,
  addDays,
  emptyWeekGrid,
  advanceWeekGrid,
  advanceWeekGridPosition,
  advanceMonthGrid,
  DUTY_WEEKDAYS,
} from '@/lib/engine/rotation';

const monthKey = (dateStr) => dateStr.slice(0, 7); // 'YYYY-MM'

// dryRun=true: DB'ye hiçbir yazma/silme yapmadan generateBulkSchedule'ın
// TÜM mantığını çalıştırır, sadece sonuçta (createdCount, emptySlots)
// döner. Kullanıcı isteği: "öğretmen sayısı yetersizse hangi yer/günün
// boş kalacağını PROGRAM OLUŞTURMADAN ÖNCE sor." Gerçek çalıştırmadan
// önce bu modla önizleme yapılıp idareciye onaylatılır.
export async function generateBulkSchedule(supabase, { schoolId, startDate, endDate, dryRun = false }) {
  // 0) Deneme süresi dolmuş / aboneliği kullanılamaz okullar program
  // üretemez. En derin noktada kontrol edilir (savunma amaçlı). Deneme
  // sürümündeyse tarih aralığı da burada sınırlanır (en fazla ~1 ay).
  await requireUsableSubscription(supabase, schoolId, { startDate, endDate });

  // 1) İdempotency: bu aralıktaki eski otomatik atamaları temizle,
  // elle düzenlenmiş (is_manual=true) satırlara dokunma. dryRun'da DB'ye
  // dokunulmaz — aşağıda existingRows okunurken aynı etki SİMÜLE edilir.
  if (!dryRun) {
    await deleteAutoAssignmentsInRange(supabase, schoolId, startDate, endDate);
  }

  // 2) Çapa: aralıktan önceki son atama günü (varsa). Takvim, sıra
  // sayımı için çapanın haftasından itibaren çekilir.
  const anchorDate = await getLatestAssignmentDateBefore(supabase, schoolId, startDate);
  const anchorWeekStart = anchorDate ? getWeekStart(anchorDate) : null;
  // haftalik_yer modunda çapa haftasında bazı hücreler o hafta uygun
  // aday kalmadığı için boş kalmış olabilir (kullanıcı raporu: bir
  // hücre bir hafta boş kalınca o hücrenin deseni SIFIRLANIYORDU, ekip
  // sıradan koptuktan sonra bir daha düzelmiyordu) — gerçek sahiplerini
  // bulmak için birkaç hafta daha geriye bakılır (bkz. adım 4); takvim
  // günleri de o kadar geriden çekilir, yoksa o haftaların tatil olup
  // olmadığı bilinmez ve adım sayımı yanlış çıkar.
  const ROTATION_LOOKBACK_WEEKS = 26;
  const calendarFrom = anchorWeekStart && anchorWeekStart < startDate
    ? addDays(anchorWeekStart, -7 * ROTATION_LOOKBACK_WEEKS)
    : startDate;

  // 3) Gerekli tüm veriyi çek.
  const [allTeachers, allZones, calendarDays, activeRuleKeys, rotationMode] = await Promise.all([
    getTeachers(supabase, schoolId),
    getDutyZones(supabase, schoolId),
    getCalendarDays(supabase, schoolId, calendarFrom, endDate),
    getActiveHardRuleKeys(supabase, schoolId),
    getSchoolRotationMode(supabase, schoolId),
  ]);
  const teachers = allTeachers.filter((t) => t.is_active);
  // Gün kısıtlı (restriction_mode 'ONLY'/'EXCEPT') VEYA yer kısıtlı
  // (fixed_zone_id dolu) öğretmenler haftalik_yer desenine hiç katılmaz —
  // bkz. Faz 0 ve Faz B'deki kullanım. Faz B (adillik doldurma + desene
  // katılma) SADECE kısıtsız öğretmenleri dener; kısıtlılar zaten Faz
  // 0'da öncelikli olarak denenmiş oldu. Yer kısıtı olan bir öğretmen Faz
  // 0'da TÜM bölgeler için aday gösterilir ama checkTeacherZoneRestriction
  // (lib/engine/rules) kendi sabit bölgesi dışındaki her bölgede onu eler
  // — bu yüzden burada ayrıca bölgeye göre filtrelemeye gerek yok.
  const isTeacherPatternRestricted = (t) => t.restriction_mode !== 'ALL' || !!t.fixed_zone_id;
  const restrictedTeachers = teachers.filter(isTeacherPatternRestricted);
  const unrestrictedTeachers = teachers.filter((t) => !isTeacherPatternRestricted(t));
  const restrictedTeacherIds = new Set(restrictedTeachers.map((t) => t.id));
  const zones = allZones.filter((z) => z.is_active);
  const teachersById = Object.fromEntries(teachers.map((t) => [t.id, t]));
  const zoneCount = zones.length;
  const zoneIndexById = Object.fromEntries(zones.map((z, i) => [z.id, i]));

  const teacherIds = teachers.map((t) => t.id);
  const zoneIds = zones.map((z) => z.id);

  const [unavailableByTeacher, closuresByZone, dutyCountByTeacher] = await Promise.all([
    getUnavailableWeekdaysForTeachers(supabase, teacherIds),
    getZoneClosuresForZones(supabase, zoneIds),
    // Silme sonrası kalan veriden başlar (selectFairest'in "tüm
    // zamanlar" adillik tanımıyla tutarlı).
    getTotalAssignmentCounts(supabase, schoolId),
  ]);

  const calendarByDate = Object.fromEntries(calendarDays.map((c) => [c.calendar_date, c]));
  const isSchedulable = (date) =>
    isSchedulableDay({ weekday: getWeekday(date), calendarDay: calendarByDate[date] });

  // Silme adımından sonra aralıkta hâlâ satır varsa bunlar sadece
  // is_manual=true olabilir. Kapasite ve günlük limit hesabına katılır.
  // dryRun'da gerçek silme yapılmadığı için otomatik (is_manual=false)
  // satırlar burada elle filtrelenip aynı etki simüle edilir.
  let existingRows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
  if (dryRun) existingRows = existingRows.filter((r) => r.is_manual);
  const existingCountByDateZone = {};
  const existingTeacherIdsByDate = {};
  // Haftalık nöbet limiti (max_duty_per_week hard rule) için: hafta →
  // öğretmen → o haftaki nöbet sayısı. Elle (is_manual) satırlar da sayılır.
  const weeklyCounts = {};
  for (const row of existingRows) {
    const date = row.duty_date;
    const zoneId = row.duty_zones?.id;
    const teacherId = row.teachers?.id;
    (existingCountByDateZone[date] ??= {})[zoneId] = (existingCountByDateZone[date]?.[zoneId] || 0) + 1;
    (existingTeacherIdsByDate[date] ??= {})[teacherId] = (existingTeacherIdsByDate[date]?.[teacherId] || 0) + 1;
    const ws = getWeekStart(date);
    (weeklyCounts[ws] ??= {})[teacherId] = (weeklyCounts[ws]?.[teacherId] || 0) + 1;
  }

  const schedulableDates = eachDateStr(startDate, endDate).filter(isSchedulable);

  const assignedCountByDateZone = {};
  const dailyCountsByDate = {};
  function ensureZoneCounts(date) {
    return (assignedCountByDateZone[date] ??= { ...(existingCountByDateZone[date] || {}) });
  }
  function ensureDailyCounts(date) {
    return (dailyCountsByDate[date] ??= { ...(existingTeacherIdsByDate[date] || {}) });
  }

  // Tatilde sıra dönmez: sadece en az bir okul günü olan hafta/aylar sayılır.
  const weekIsSchedulable = (weekStart) =>
    DUTY_WEEKDAYS.some((d) => isSchedulable(addDays(weekStart, d - 1)));
  // (afterWeekStart, throughWeekStart] aralığındaki işlenebilir hafta sayısı.
  function countSchedulableWeeks(afterWeekStart, throughWeekStart) {
    let count = 0;
    for (let w = addDays(afterWeekStart, 7); w <= throughWeekStart; w = addDays(w, 7)) {
      if (weekIsSchedulable(w)) count++;
    }
    return count;
  }

  // 4) Çapa haftasının düzenini ızgaraya yükle: weekday → [zoneIndex] =
  // teacherId[].
  //
  // haftalik_yer: çapa haftasının bazı hücreleri o hafta boş kalmış
  // olabilir (o gün uygun aday kalmamıştı) — bu durumda hücrenin
  // GERÇEK sahibini bulmak için haftayı haftayı geriye bakılır. Her
  // geriye gidilen haftada bulunan bir ekip, o haftadan çapaya kaç
  // ADIM (işlenebilir hafta) geçtiği hesaplanıp o kadar ileri
  // kaydırılarak yerleştirilir (advanceWeekGridPosition, kapalı form —
  // advanceWeekGrid'i tekrar tekrar çağırmadan). Daha YENİ bir haftadan
  // zaten dolan hücreler bir daha ezilmez. En fazla
  // ROTATION_LOOKBACK_WEEKS hafta geriye bakılır (makul bir sınır);
  // tüm hücreler dolunca arama durur.
  let grid = emptyWeekGrid(zoneCount);
  if (anchorDate && zoneCount) {
    if (rotationMode === 'haftalik_yer') {
      const totalSlots = zoneCount * DUTY_WEEKDAYS.length;
      let filledSlots = 0;
      let searchWeekStart = anchorWeekStart;
      for (let attempt = 0; attempt < ROTATION_LOOKBACK_WEEKS && filledSlots < totalSlots; attempt++) {
        const weekEnd = addDays(searchWeekStart, 6) < startDate ? addDays(searchWeekStart, 6) : addDays(startDate, -1);
        const rows = await getAssignmentsForRange(supabase, schoolId, searchWeekStart, weekEnd);
        const stepsFromHere = countSchedulableWeeks(searchWeekStart, anchorWeekStart);
        for (const row of rows) {
          const zi = zoneIndexById[row.duty_zones?.id];
          const teacherId = row.teachers?.id;
          const weekday = getWeekday(row.duty_date);
          // Silinmiş/pasif/gün kısıtlı öğretmenler desene alınmaz
          // (hayalet hücre veya eski/bozuk kısıtlı-sahip olmasın).
          if (zi === undefined || !teachersById[teacherId] || !grid[weekday] || restrictedTeacherIds.has(teacherId)) continue;
          const dest = advanceWeekGridPosition(weekday, zi, zoneCount, stepsFromHere);
          if (grid[dest.weekday][dest.zi].length) continue; // daha yeni bir haftadan zaten dolu
          grid[dest.weekday][dest.zi] = [teacherId];
          filledSlots++;
        }
        searchWeekStart = addDays(searchWeekStart, -7);
      }
    } else {
      // Aylık modlarda düzen ay içinde sabit — tek haftalık bir örnek
      // yeterli (bu modların aynı gap-toleransı henüz eklenmedi, bkz.
      // PHASE_REPORT sonraki adım riskleri).
      const anchorEnd = addDays(anchorWeekStart, 6) < startDate ? addDays(anchorWeekStart, 6) : addDays(startDate, -1);
      const anchorRows = await getAssignmentsForRange(supabase, schoolId, anchorWeekStart, anchorEnd);
      for (const row of anchorRows) {
        const zi = zoneIndexById[row.duty_zones?.id];
        const teacherId = row.teachers?.id;
        const weekday = getWeekday(row.duty_date);
        if (zi === undefined || !teachersById[teacherId] || !grid[weekday] || restrictedTeacherIds.has(teacherId)) continue;
        grid[weekday][zi] = [...grid[weekday][zi], teacherId];
      }
    }
  }

  const monthIsSchedulable = (mk) => {
    const [y, m] = mk.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return eachDateStr(`${mk}-01`, `${mk}-${String(lastDay).padStart(2, '0')}`).some(isSchedulable);
  };
  // (afterMonth, throughMonth] aralığındaki işlenebilir ay sayısı.
  function countSchedulableMonths(afterMk, throughMk) {
    let count = 0;
    let [y, m] = afterMk.split('-').map(Number);
    for (;;) {
      m++;
      if (m > 12) { m = 1; y++; }
      const mk = `${y}-${String(m).padStart(2, '0')}`;
      if (mk > throughMk) break;
      if (monthIsSchedulable(mk)) count++;
    }
    return count;
  }

  const isMonthly = rotationMode === 'aylik_ayni_gun' || rotationMode === 'aylik_farkli_gun';
  function advanceGrid(steps) {
    for (let s = 0; s < steps; s++) {
      grid = isMonthly
        ? advanceMonthGrid(grid, zoneCount, { shiftDay: rotationMode === 'aylik_farkli_gun' })
        : advanceWeekGrid(grid, zoneCount);
    }
  }

  // Izgara imleci: ızgaranın şu an hangi hafta/ayın düzenini tuttuğu.
  let gridWeekStart = anchorDate ? anchorWeekStart : null;
  let gridMonth = anchorDate ? monthKey(anchorDate) : null;

  const newAssignments = [];

  function buildContext(teacher, zone, date, weekday, dailyCounts, weekCounts) {
    return {
      teacher,
      zone,
      unavailableWeekdays: unavailableByTeacher[teacher.id] || [],
      closures: closuresByZone[zone.id] || [],
      date,
      weekday,
      existingAssignmentCountForDate: dailyCounts[teacher.id] || 0,
      existingAssignmentCountForWeek: weekCounts[teacher.id] || 0,
    };
  }

  // Hafta hafta işlenir ve her hafta İKİ geçişte doldurulur:
  // 1. geçiş — Faz A: haftanın TÜM günlerinde sırası gelen (desendeki)
  // öğretmenler yerleştirilir. 2. geçiş — Faz B: kalan boş hücreler
  // adillikle doldurulur. İki geçiş şart: haftalık nöbet limiti
  // (max_duty_per_week) varken adillik doldurması haftanın erken bir
  // gününde çalışsaydı, sırası haftanın ilerleyen günündeki bir
  // öğretmenin haftalık hakkını "çalar", desendeki öğretmen kendi
  // gününe gelemeden elenirdi.
  const weekChunks = [];
  for (const date of schedulableDates) {
    const ws = getWeekStart(date);
    if (!weekChunks.length || weekChunks[weekChunks.length - 1].weekStart !== ws) {
      weekChunks.push({ weekStart: ws, dates: [] });
    }
    weekChunks[weekChunks.length - 1].dates.push(date);
  }

  for (const week of weekChunks) {
    const weekCounts = (weeklyCounts[week.weekStart] ??= {});

    // ── Sıra ilerletme (hafta/ay değişince, tatiller sayılmadan) ───
    if (zoneCount && !isMonthly) {
      if (gridWeekStart === null) gridWeekStart = week.weekStart;
      else if (week.weekStart !== gridWeekStart) {
        advanceGrid(countSchedulableWeeks(gridWeekStart, week.weekStart));
        gridWeekStart = week.weekStart;
      }
    }

    // ── 0. geçiş / Faz 0: gün kısıtlı öğretmenler ÖNCELİKLİ ────────
    // (restriction_mode 'ONLY'/'EXCEPT'). Kullanıcı raporu: "sadece
    // çarşamba nöbet tutabilir" işaretlenen bir öğretmen her çarşamba
    // ata anmıyordu. Kök neden: haftalik_yer'in gün-öncelikli tek
    // döngüsü herkesi aynı şekilde ilerletiyor — kısıtlı bir öğretmen
    // desene (grid) katılırsa, döngü onu er ya da geç MÜSAİT OLMADIĞI
    // bir güne kaydırıyor, orada sonsuza kadar elenip haftalarca
    // atanamıyordu (döngü onu tekrar müsait olduğu güne getirene kadar).
    // Çözüm: kısıtlı öğretmenler ASLA desene katılmaz (aşağıdaki Faz
    // B'de hariç tutuluyorlar) — bunun yerine HER hafta, müsait
    // oldukları günde, normal desenden ÖNCE öncelikli olarak atanırlar.
    // Böylece "tek gün çalışabilen" biri, o günün az sayıdaki
    // alternatifinden biri olduğu için neredeyse her zaman seçilir.
    for (const date of week.dates) {
      const weekday = getWeekday(date);
      const zoneCounts = ensureZoneCounts(date);
      const dailyCounts = ensureDailyCounts(date);

      zones.forEach((zone) => {
        const remainingSlots = Math.max(0, zone.required_count - (zoneCounts[zone.id] || 0));
        if (remainingSlots === 0) return;

        const candidates = restrictedTeachers
          .map((teacher) => ({
            teacher,
            result: checkHardRules(buildContext(teacher, zone, date, weekday, dailyCounts, weekCounts), { activeRuleKeys }),
          }))
          .filter((c) => c.result.eligible)
          .map((c) => ({ teacher: c.teacher, dutyCount: dutyCountByTeacher[c.teacher.id] || 0 }));

        const selected = selectFairest(candidates, remainingSlots);
        for (const s of selected) {
          newAssignments.push({ teacherId: s.teacher.id, zoneId: zone.id, date });
          dutyCountByTeacher[s.teacher.id] = (dutyCountByTeacher[s.teacher.id] || 0) + 1;
          dailyCounts[s.teacher.id] = (dailyCounts[s.teacher.id] || 0) + 1;
          weekCounts[s.teacher.id] = (weekCounts[s.teacher.id] || 0) + 1;
          zoneCounts[zone.id] = (zoneCounts[zone.id] || 0) + 1;
        }
      });
    }

    // ── 1. geçiş / Faz A: desendekiler (haftanın tüm günleri) ──────
    for (const date of week.dates) {
      // Aylık modlarda ay geçişi hafta ortasına da denk gelebilir —
      // ilerletme bu yüzden gün döngüsünün içinde, ay değişince yapılır.
      if (zoneCount && isMonthly) {
        const mk = monthKey(date);
        if (gridMonth === null) gridMonth = mk;
        else if (mk !== gridMonth) {
          advanceGrid(countSchedulableMonths(gridMonth, mk));
          gridMonth = mk;
        }
      }

      const weekday = getWeekday(date);
      const zoneCounts = ensureZoneCounts(date);
      const dailyCounts = ensureDailyCounts(date);

      zones.forEach((zone, zi) => {
        for (const teacherId of grid[weekday]?.[zi] || []) {
          if ((zoneCounts[zone.id] || 0) >= zone.required_count) break;
          const teacher = teachersById[teacherId];
          if (!teacher) continue;
          const result = checkHardRules(buildContext(teacher, zone, date, weekday, dailyCounts, weekCounts), { activeRuleKeys });
          if (!result.eligible) continue;

          newAssignments.push({ teacherId: teacher.id, zoneId: zone.id, date });
          dutyCountByTeacher[teacher.id] = (dutyCountByTeacher[teacher.id] || 0) + 1;
          dailyCounts[teacher.id] = (dailyCounts[teacher.id] || 0) + 1;
          weekCounts[teacher.id] = (weekCounts[teacher.id] || 0) + 1;
          zoneCounts[zone.id] = (zoneCounts[zone.id] || 0) + 1;
        }
      });
    }

    // ── 2. geçiş / Faz B: basit adillik (kalan boş hücreler) ───────
    // İlk üretimde (çapa yok) tüm düzen burada kurulur; sonrasında
    // sadece desende sahibi olmayan veya sahibi o gün uygun olmayan
    // hücreleri doldurur.
    for (const date of week.dates) {
      const weekday = getWeekday(date);
      const zoneCounts = ensureZoneCounts(date);
      const dailyCounts = ensureDailyCounts(date);

      zones.forEach((zone, zi) => {
        const remainingSlots = Math.max(0, zone.required_count - (zoneCounts[zone.id] || 0));
        if (remainingSlots === 0) return;

        const candidates = unrestrictedTeachers
          .map((teacher) => ({
            teacher,
            result: checkHardRules(buildContext(teacher, zone, date, weekday, dailyCounts, weekCounts), { activeRuleKeys }),
          }))
          .filter((c) => c.result.eligible)
          .map((c) => ({ teacher: c.teacher, dutyCount: dutyCountByTeacher[c.teacher.id] || 0 }));

        const selected = selectFairest(candidates, remainingSlots);

        for (const s of selected) {
          newAssignments.push({ teacherId: s.teacher.id, zoneId: zone.id, date });
          dutyCountByTeacher[s.teacher.id] = (dutyCountByTeacher[s.teacher.id] || 0) + 1;
          dailyCounts[s.teacher.id] = (dailyCounts[s.teacher.id] || 0) + 1;
          weekCounts[s.teacher.id] = (weekCounts[s.teacher.id] || 0) + 1;
          zoneCounts[zone.id] = (zoneCounts[zone.id] || 0) + 1;

          // Desende bu hücrenin sahibi eksikse dolduran öğretmen desene
          // KATILIR (bundan sonra sırayla döner). Sahibi var ama bugün
          // uygun değilse desene dokunulmaz — sahibi sırasına geri döner.
          const cell = grid[weekday]?.[zi];
          if (cell && cell.length < zone.required_count) {
            grid[weekday][zi] = [...cell, s.teacher.id];
          }
        }
      });
    }
  }

  // 5) Boş kalan yerler: öğretmen sayısı yetersiz olduğu için required_count'a
  // ulaşamamış (gün, bölge) hücreleri — idareciye "Program Oluştur"dan ÖNCE
  // gösterilecek (dryRun) veya sonuç raporunda dönecek liste.
  const emptySlots = [];
  for (const date of schedulableDates) {
    const zoneCounts = assignedCountByDateZone[date] || {};
    for (const zone of zones) {
      const filled = zoneCounts[zone.id] || 0;
      if (filled < zone.required_count) {
        emptySlots.push({ date, zoneId: zone.id, zoneName: zone.name, missing: zone.required_count - filled });
      }
    }
  }

  if (dryRun) {
    return { createdCount: newAssignments.length, emptySlots };
  }

  // 6) Tek toplu yazma.
  const created = await createAssignments(supabase, schoolId, newAssignments);
  return { createdCount: created.length, emptySlots };
}
