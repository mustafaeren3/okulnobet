// Nöbet programı oluşturma mantığı — Nobet_Sistemi.html'deki algoritmanın
// saf (pure) fonksiyonlar halinde taşınmış hali. DOM'a dokunmaz.

export const PALETTE = [
  '4472C4', 'ED7D31', 'A9D18E', 'FF0000', '00B0F0', 'FFFF00', '00B050',
  '7030A0', 'FF6600', '9999FF', 'C00000', '00CCCC', '339966', 'BF8F00',
  '7F7F7F', '843C0C', '375623', '2E75B6', 'FF69B4', 'E040FB', '26A69A',
  'F06292', '8D6E63', '78909C', 'D4E157', 'FF7043', '5C6BC0', 'AB47BC',
];

export const DOW_CODE = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5 };

export const RESTRICT_LABELS = {
  MON: '⚡ SADECE PZT', TUE: '⚡ SADECE SAL', WED: '⚡ SADECE ÇAR', THU: '⚡ SADECE PER', FRI: '⚡ SADECE CUM',
  NO_MON: '⛔ PZT HARİÇ', NO_TUE: '⛔ SAL HARİÇ', NO_WED: '⛔ ÇAR HARİÇ', NO_THU: '⛔ PER HARİÇ', NO_FRI: '⛔ CUM HARİÇ',
};

export const DAY_TR = { 0: 'Pazar', 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi' };

// Kaynak: MEB 2026/68 nolu genelge — "2026-2027 Eğitim ve Öğretim Yılı Çalışma Takvimi"
export const ACADEMIC_YEAR_2026_2027_HOLIDAYS = {
  '2026-11-16': 'Ara Tatil (1. Dönem)',
  '2026-11-17': 'Ara Tatil (1. Dönem)',
  '2026-11-18': 'Ara Tatil (1. Dönem)',
  '2026-11-19': 'Ara Tatil (1. Dönem)',
  '2026-11-20': 'Ara Tatil (1. Dönem)',
  '2026-10-29': 'Cumhuriyet Bayramı',
  '2027-01-25': 'Yarıyıl Tatili',
  '2027-01-26': 'Yarıyıl Tatili',
  '2027-01-27': 'Yarıyıl Tatili',
  '2027-01-28': 'Yarıyıl Tatili',
  '2027-01-29': 'Yarıyıl Tatili',
  '2027-02-01': 'Yarıyıl Tatili',
  '2027-02-02': 'Yarıyıl Tatili',
  '2027-02-03': 'Yarıyıl Tatili',
  '2027-02-04': 'Yarıyıl Tatili',
  '2027-02-05': 'Yarıyıl Tatili',
  '2027-03-08': 'Ara Tatil / Ramazan Bayramı Arefe',
  '2027-03-09': 'Ara Tatil / Ramazan Bayramı 1.Gün',
  '2027-03-10': 'Ara Tatil / Ramazan Bayramı 2.Gün',
  '2027-03-11': 'Ara Tatil / Ramazan Bayramı 3.Gün',
  '2027-03-12': 'Ara Tatil (2. Dönem)',
  '2027-04-23': 'Ulusal Egemenlik ve Çocuk Bayramı',
  '2027-05-01': 'Emek ve Dayanışma Günü',
  '2027-05-15': 'Kurban Bayramı Arefe',
  '2027-05-16': 'Kurban Bayramı 1.Gün',
  '2027-05-17': 'Kurban Bayramı 2.Gün',
  '2027-05-18': 'Kurban Bayramı 3.Gün',
  '2027-05-19': "Kurban Bayramı 4.Gün / Atatürk'ü Anma Gençlik ve Spor Bayramı",
};

export function onlyDow(p) {
  if (!p.restrict_code) return null;
  return DOW_CODE[p.restrict_code] || null;
}

export function exceptDow(p) {
  if (!p.restrict_code || !p.restrict_code.startsWith('NO_')) return null;
  const code = p.restrict_code.slice(3);
  return DOW_CODE[code] || null;
}

export function ymdStr(d) {
  const dd = new Date(d);
  return dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');
}

export function formatDate(ymd) {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

export function mondayOf(d) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  const diff = t.getDay() === 0 ? -6 : 1 - t.getDay();
  t.setDate(t.getDate() + diff);
  return t.toISOString().slice(0, 10);
}

export function groupByWeek(sched) {
  const weeks = [];
  let curWk = null;
  let curMon = null;
  sched.forEach((slot) => {
    const d = new Date(slot.date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    const monStr = ymdStr(mon);
    if (monStr !== curMon) {
      curWk = [];
      weeks.push(curWk);
      curMon = monStr;
    }
    curWk.push(slot);
  });
  return weeks;
}

export function luminance(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export const DIST_METHODS = {
  'haftalik-gun': 'Haftalık Gün Kaydırma',
  'haftalik-yer': 'Haftalık Yer Kaydırma',
  'haftalik-gun-yer': 'Haftalık Gün ve Yer Kaydırma',
  'aylik-gun': 'Aylık Gün Kaydırma',
  'aylik-yer': 'Aylık Yer Kaydırma',
  'aylik-gun-yer': 'Aylık Gün ve Yer Kaydırma',
};

// "gün" yöntemlerinde her kişinin nöbet yeri mümkün olduğunca sabit tutulur,
// sadece hangi güne denk geldiği zamanla kayar. "yer" yöntemlerinde her
// kişinin nöbet günü mümkün olduğunca sabit tutulur, sadece hangi lokasyona
// denk geldiği zamanla kayar. "gün ve yer" yöntemlerinde ikisi birlikte
// kayar. "haftalık" yöntemlerde kayma her hafta, "aylık" yöntemlerde kayma
// her 4 haftada bir (aynı günde toplam 4 nöbet tutulunca) gerçekleşir.
//
// Bir kişinin nöbet yeri her zaman lokasyon listesindeki eklenme sırasıyla
// ilerler (A→B→C→A...). "gün"/"gün ve yer" yöntemlerinde gün de sabit
// Cuma→Perşembe→Çarşamba→Salı→Pazartesi sırasıyla ilerler. Bu sıralar her
// kişi ilk kez atandığında sabitlenir ("temel ofset"); sonraki her
// periyotta (hafta/ay) bu ofsetten ilerleyerek beklenen gün/yer hesaplanır.
//
// Hiçbir nöbet yeri gereksiz yere boş bırakılmaz: önce bu beklentilere uyan
// kişi denenir, uymayan biri gerekiyorsa (adillik için) devreye girer, hiç
// kimse uygun değilse "çift nöbet tutabilir" işaretli birine ikinci görev
// verilir — sadece o da yoksa boş kalır.

// persons: [{id, name, num, restrict_code, color, allow_double_duty}]
// locations: [{id, name}]
// holidays: { 'YYYY-MM-DD': description }
export function generateSchedule({ persons, locations, holidays, activeDays, startDate, endDate, distMethod = 'haftalik-gun-yer' }) {
  const mode = distMethod.replace(/^haftalik-|^aylik-/, ''); // 'gun' | 'yer' | 'gun-yer'
  const isMonthly = distMethod.startsWith('aylik-');

  // "gün kaydırma" ve "gün ve yer kaydırma" modlarında günün kayma yönü
  // her zaman sabit Cuma→Perşembe→Çarşamba→Salı→Pazartesi (haftanın tersi)
  // sırasıyla ilerler. "yer kaydırma" modunda gün sabit tutulduğu için sıra
  // önemsizdir, olağan (Pzt→Cum) sırada kalır.
  const FIXED_REVERSE_DOW_ORDER = [5, 4, 3, 2, 1, 6, 0];
  const sortedDows = mode === 'yer'
    ? [...activeDays].sort((a, b) => a - b)
    : FIXED_REVERSE_DOW_ORDER.filter((d) => activeDays.includes(d));
  const D = sortedDows.length;
  const L = locations.length;

  const onlyGroups = {};
  const exceptDayOf = {};
  const doubleDutyOf = {};
  const generalPool = [];

  persons.forEach((p) => {
    doubleDutyOf[p.name] = !!p.allow_double_duty;
    const oD = onlyDow(p);
    if (oD) {
      onlyGroups[oD] = onlyGroups[oD] || [];
      onlyGroups[oD].push(p);
    } else {
      generalPool.push(p);
      const eD = exceptDow(p);
      if (eD) exceptDayOf[p.name] = eD;
    }
  });

  const N = generalPool.length;

  const allDays = [];
  let cur = new Date(startDate + 'T00:00:00');
  const endD = new Date(endDate + 'T00:00:00');
  while (cur <= endD) {
    const dow = cur.getDay();
    const ymd = ymdStr(cur);
    if (activeDays.includes(dow)) {
      allDays.push({ date: new Date(cur), ymd, dow, isHoliday: !!holidays[ymd] });
    }
    cur.setDate(cur.getDate() + 1);
  }
  if (!allDays.length) return null;

  const weekHasActive = {};
  allDays.forEach((day) => {
    if (!day.isHoliday) weekHasActive[mondayOf(day.date)] = true;
  });
  const weekIndexMap = {};
  Object.keys(weekHasActive).sort().forEach((mon, i) => {
    weekIndexMap[mon] = i;
  });

  const sched = [];
  const totalCount = {};
  // Lokasyon sırası her zaman kişinin KENDİ nöbet tuttuğu her seferde bir
  // ilerler (takvim haftasına değil, kişinin fiilen kaç kez nöbet tuttuğuna
  // bağlı — bu yüzden bir hafta atlansa bile sıra atlamaz). "gun"/"gun-yer"
  // modlarında gün de aynı şekilde, kişinin YENİ bir takvim gününde nöbet
  // tuttuğu her seferde bir ilerler. "Aylık" yöntemlerde bu ilerleme her 4
  // kişisel nöbette bir gerçekleşir (4 kez nöbet tutulunca bir sonrakine
  // geçilir), "haftalık" yöntemlerde her seferinde gerçekleşir.
  const baseLocOffset = {};
  const locTurn = {};
  const baseDowOffset = {};
  const dowTurn = {};
  const lastAssignedYmd = {};
  persons.forEach((p) => {
    totalCount[p.name] = 0;
  });

  function periodOf(turnCount) {
    return isMonthly ? Math.floor(turnCount / 4) : turnCount;
  }

  function expectedLoc(name) {
    if (baseLocOffset[name] === undefined) return undefined;
    const t = periodOf(locTurn[name] || 0);
    return (baseLocOffset[name] + t) % L;
  }

  // "yer" modunda gün, kişi lokasyon listesinde tam bir tur atana kadar
  // (yani L kez nöbet tutana kadar) sabit kalır; tur tamamlanınca bir
  // sonraki güne geçilir. Diğer modlarda gün, kişinin yeni bir takvim
  // gününde nöbet tuttuğu her seferde (periodOf ile) ilerler.
  function expectedDow(name) {
    if (mode === 'yer') {
      if (baseDowOffset[name] === undefined) return undefined;
      const cyclesCompleted = Math.floor((locTurn[name] || 0) / L);
      return sortedDows[(baseDowOffset[name] + cyclesCompleted) % D];
    }
    if (baseDowOffset[name] === undefined) return undefined;
    const t = periodOf(dowTurn[name] || 0);
    return sortedDows[(baseDowOffset[name] + t) % D];
  }

  function recordAssignment(name, dow, li, ymd) {
    if (baseLocOffset[name] === undefined) baseLocOffset[name] = li;
    locTurn[name] = (locTurn[name] || 0) + 1;

    if (baseDowOffset[name] === undefined) baseDowOffset[name] = sortedDows.indexOf(dow);

    if (mode !== 'yer' && lastAssignedYmd[name] !== ymd) {
      dowTurn[name] = (dowTurn[name] || 0) + 1;
      lastAssignedYmd[name] = ymd;
    }
  }

  allDays.forEach(({ date, ymd, dow, isHoliday }) => {
    const slot = { date, ymd, isHoliday, slots: {} };
    if (isHoliday) {
      locations.forEach((loc) => {
        slot.slots[loc.name] = null;
      });
      sched.push(slot);
      return;
    }

    const mon = mondayOf(date);
    const wIdx = weekIndexMap[mon] !== undefined ? weekIndexMap[mon] : 0;

    const reservedByLoc = {};
    const grp = onlyGroups[dow] || [];
    if (grp.length) {
      const k = grp.length;
      const capacity = Math.min(k, L);
      for (let idx = 0; idx < capacity; idx++) {
        const li = (wIdx + idx) % L;
        const member = k <= L ? grp[idx] : grp[(wIdx + idx) % k];
        reservedByLoc[li] = member;
      }
    }

    const usedNamesThisDay = new Set(Object.values(reservedByLoc).map((person) => person.name));

    locations.forEach((loc, li) => {
      if (reservedByLoc[li] !== undefined) {
        const person = reservedByLoc[li];
        slot.slots[loc.name] = person;
        totalCount[person.name]++;
        recordAssignment(person.name, dow, li, ymd);
        return;
      }

      if (N === 0) {
        slot.slots[loc.name] = null;
        return;
      }

      // Öncelik sırası: (1) hem beklenen gün hem beklenen yer uyan, (2) sadece
      // yer uyan, (3) sadece gün uyan, (4) herhangi uygun kişi. Her katmanda
      // en az nöbet tutmuş kişi seçilir — sıra tercih edilir ama adillik ve
      // "boş kalmasın" kuralı için gerekirse esnetilir.
      function leastBusy(list) {
        let best = null;
        let bestCount = Infinity;
        list.forEach((cand) => {
          const c = totalCount[cand.name];
          if (c < bestCount) {
            best = cand;
            bestCount = c;
          }
        });
        return best;
      }

      function pickFrom(eligible) {
        const locMatch = (cand) => expectedLoc(cand.name) === undefined || expectedLoc(cand.name) === li;
        const dowMatch = (cand) => expectedDow(cand.name) === undefined || expectedDow(cand.name) === dow;
        const tiers = [
          eligible.filter((c) => locMatch(c) && dowMatch(c)),
          eligible.filter((c) => locMatch(c)),
          eligible.filter((c) => dowMatch(c)),
          eligible,
        ];
        for (const tier of tiers) {
          if (tier.length) return leastBusy(tier);
        }
        return null;
      }

      let p = pickFrom(generalPool.filter((cand) => exceptDayOf[cand.name] !== dow && !usedNamesThisDay.has(cand.name)));

      // Kimse müsait değilse, "çift nöbet tutabilir" işaretli birine ikinci
      // görev verilir — sadece bulunamazsa yer boş kalır.
      if (!p) {
        p = pickFrom(generalPool.filter((cand) => exceptDayOf[cand.name] !== dow && doubleDutyOf[cand.name]));
      }

      if (!p) {
        slot.slots[loc.name] = null;
        return;
      }

      usedNamesThisDay.add(p.name);
      slot.slots[loc.name] = p;
      totalCount[p.name]++;
      recordAssignment(p.name, dow, li, ymd);
    });

    sched.push(slot);
  });

  return { schedule: sched, totalCount };
}
