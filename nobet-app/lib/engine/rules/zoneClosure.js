// Hard rule: bölge, verilen tarihte zone_closures'ta kayıtlı bir
// kapanış aralığına denk geliyorsa uygun değildir. Saf fonksiyon.
//
// date, closures[].start_date, closures[].end_date: 'YYYY-MM-DD' formatında
// ISO tarih string'i — bu formatta lexicographic karşılaştırma tarih
// karşılaştırmasıyla aynı sonucu verir, Date parse etmeye gerek yok.

export function checkZoneClosure({ closures, date }) {
  const isClosed = (closures || []).some((c) => date >= c.start_date && date <= c.end_date);
  return isClosed
    ? { eligible: false, ruleKey: 'zone_closure', reason: 'zone_closed' }
    : { eligible: true, ruleKey: 'zone_closure' };
}
