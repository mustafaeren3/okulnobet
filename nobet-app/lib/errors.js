// Hata mesajı sıkılaştırma (O3 bulgusu — production'da iç veritabanı
// bilgisi sızdırma). Saf fonksiyon, DB/Next.js bilmez.
//
// Çoğu hata mesajı bizim kendi `raise exception 'Türkçe metin'`
// çağrılarımızdan geliyor (SQL fonksiyonlarında, bkz. supabase/migrations/) —
// bunlar zaten kullanıcıya gösterilmek üzere Türkçe yazıldı, GÜVENLİ.
// Riskli olan, Postgres'in KENDİSİNİN ürettiği ham hatalar (constraint
// adı, tablo/kolon adı, "schema cache" gibi iç şema bilgisi içerir) —
// bunlar aşağıdaki desenlerden biriyle eşleşirse generic bir mesajla
// değiştirilir.
const LEAK_PATTERNS = [
  /relation "/i,
  /column "/i,
  /constraint "/i,
  /duplicate key/i,
  /schema cache/i,
  /syntax error/i,
  /permission denied for/i,
  /violates .* constraint/i,
  /does not exist/i,
  /connection/i,
];

const GENERIC_MESSAGE = 'Bir şeyler ters gitti, tekrar dene. Sorun devam ederse destek ile iletişime geç.';

export function sanitizeDbErrorMessage(rawMessage) {
  const msg = String(rawMessage || '');
  if (LEAK_PATTERNS.some((p) => p.test(msg))) {
    return GENERIC_MESSAGE;
  }
  return msg;
}
