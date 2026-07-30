// Haftalık sıralı yer değişimi için saf yardımcılar. DB/Next.js/fetch
// bilmez.
//
// Rotasyon modeli (kullanıcının gerçek çizelge beklentisiyle birebir):
// her haftanın günü kendi "ekibine" sahiptir; bir sonraki hafta AYNI
// GÜNÜN ekibi, bölge listesinde (öncelik + eklenme sırası) bir bölge
// İLERİ kayar. Örn. 1. hafta Pazartesi A Blok'ta olan öğretmen 2. hafta
// Pazartesi B Blok'a geçer, sondaki bölgede olan başa döner. Kalıcı bir
// cursor tutulmaz — bir haftanın düzeni, bir önceki haftanın (DB'deki
// veya bu üretim turunda hesaplanan) düzeninden türetilir.

// Bir tarihin ait olduğu haftanın Pazartesi'sini döndürür ('YYYY-MM-DD').
// weekday: JS Date#getDay() (0=Pazar...6=Cumartesi).
export function getWeekStart(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diffToMonday);
  return formatDate(date);
}

// Bir tarihe n gün ekler (n negatif olabilir), 'YYYY-MM-DD' döndürür.
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return formatDate(new Date(y, m - 1, d + n));
}

// İki hafta başlangıcı (Pazartesi) arasındaki hafta sayısı.
// laterDateStr >= earlierDateStr ise pozitif.
export function weeksBetween(laterDateStr, earlierDateStr) {
  const toDate = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  return Math.round((toDate(laterDateStr) - toDate(earlierDateStr)) / (7 * 24 * 60 * 60 * 1000));
}

// Bir günün bölge düzenini (bölge sırasına dizilmiş öğretmen listeleri)
// k adım ileri kaydırır: her ekip k bölge İLERİ gider, sondakiler başa
// sarar — yani i. bölgenin yeni ekibi, (i-k). bölgenin eski ekibidir.
// layout: [zoneIndex] = teacherId[].
export function shiftLayout(layout, k) {
  const n = layout.length;
  if (!n) return [];
  const norm = ((k % n) + n) % n;
  return layout.map((_, i) => layout[(i - norm + n) % n]);
}

// Nöbet günleri: hafta içi (Pazartesi=1 ... Cuma=5).
export const DUTY_WEEKDAYS = [1, 2, 3, 4, 5];

// Boş bir haftalık ızgara: weekday → [zoneIndex] = teacherId[].
export function emptyWeekGrid(zoneCount) {
  const grid = {};
  for (const d of DUTY_WEEKDAYS) grid[d] = Array.from({ length: zoneCount }, () => []);
  return grid;
}

// haftalik_yer modunun BİR haftalık adımı. Hücreler gün-öncelikli tek
// bir döngü oluşturur: (Pzt,z0),(Pzt,z1)...(Pzt,zSon),(Sal,z0)...
// (Cum,zSon) → başa. Her ekip her hafta bu döngüde +1 ilerler: bölge +1
// gider; bölge listesi sarınca (son bölgeden sonra) GÜN +1 ilerleyip
// ilk bölgeden devam eder — kullanıcının tarif ettiği "bütün yerlerde
// tuttuktan sonra günü değişir" davranışı tam olarak bu.
export function advanceWeekGrid(grid, zoneCount) {
  const next = emptyWeekGrid(zoneCount);
  const days = DUTY_WEEKDAYS;
  for (let di = 0; di < days.length; di++) {
    for (let zi = 0; zi < zoneCount; zi++) {
      // Yeni (gün, bölge) hücresinin ekibi = döngüde bir ÖNCEKİ hücrenin
      // eski ekibi.
      const prevZi = zi === 0 ? zoneCount - 1 : zi - 1;
      const prevDi = zi === 0 ? (di === 0 ? days.length - 1 : di - 1) : di;
      next[days[di]][zi] = grid[days[prevDi]]?.[prevZi] || [];
    }
  }
  return next;
}

// haftalik_yer'in (gün, bölge) hücrelerini gün-öncelikli TEK bir dizi
// olarak görürsek (Pzt-z0=0, Pzt-z1=1, ..., Cum-zSon=zoneCount*5-1), bir
// ekip her adımda bu dizide +1 ilerler. Bu, "(weekday,zi)'de olan bir
// ekip N adım sonra nerede olur" sorusunun KAPALI FORMDA (advanceWeekGrid'i
// N kez döndürmeden) cevabıdır — bulkSchedule.js'in çapa (anchor)
// yeniden inşasında, bir hücrenin O HAFTA boş kalması yüzünden (uygun
// aday yoktu) ekibin "hafızasının" kaybolmaması için birkaç hafta geriye
// bakarken kullanılır: eski bir haftada bulunan bir ekip, o haftadan
// bugüne kaç adım geçtiğini bilerek doğru güncel hücresine yerleştirilir.
export function advanceWeekGridPosition(weekday, zi, zoneCount, steps) {
  const total = zoneCount * DUTY_WEEKDAYS.length;
  if (!total) return { weekday, zi };
  const dayIdx = DUTY_WEEKDAYS.indexOf(weekday);
  const pos = dayIdx * zoneCount + zi;
  const newPos = ((pos + steps) % total + total) % total;
  return { weekday: DUTY_WEEKDAYS[Math.floor(newPos / zoneCount)], zi: newPos % zoneCount };
}

// Aylık modların BİR aylık adımı.
// aylik_ayni_gun  (shiftDay=false): her günün ekibi bölge +1 kayar, gün sabit.
// aylik_farkli_gun (shiftDay=true): bölge +1 VE gün +1 — Pazartesi ekibi
// Salı'ya geçer (Cuma başa, Pazartesi'ye sarar), bölgesi de bir ilerler.
export function advanceMonthGrid(grid, zoneCount, { shiftDay }) {
  const next = emptyWeekGrid(zoneCount);
  const days = DUTY_WEEKDAYS;
  for (let di = 0; di < days.length; di++) {
    const sourceDay = shiftDay ? days[di === 0 ? days.length - 1 : di - 1] : days[di];
    next[days[di]] = shiftLayout(grid[sourceDay] || [], 1);
  }
  return next;
}

function formatDate(date) {
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
