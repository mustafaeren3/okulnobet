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

// Supabase Auth (GoTrue) hata mesajları — sanitizeDbErrorMessage'dan AYRI:
// bunlar Postgres değil, Auth servisinden geliyor, farklı bir kelime
// dağarcığı. Ham İngilizce mesajı doğrudan kullanıcıya göstermemek için
// bilinen kalıpları Türkçe, kullanıcı dostu karşılıklarına çeviriyor.
//
// NOT (dürüstlük payı): Supabase'in verifyOtp() hatası, "kod yanlış" ile
// "kodun süresi doldu" durumları için AYNI mesajı döner ("Token has
// expired or is invalid") — API bu ikisini ayırt etmiyor, dolayısıyla biz
// de ayıramıyoruz. İkisi için TEK birleşik mesaj kullanılıyor.
const AUTH_ERROR_MAP = [
  { pattern: /user already registered/i, message: 'Bu e-posta adresiyle zaten bir hesap var.' },
  { pattern: /invalid login credentials/i, message: 'E-posta veya şifre hatalı.' },
  { pattern: /token has expired or is invalid/i, message: 'Doğrulama kodu yanlış veya süresi dolmuş, tekrar deneyin.' },
  { pattern: /email rate limit exceeded/i, message: 'Çok fazla deneme yapıldı, birazdan tekrar dene.' },
  { pattern: /for security purposes.*after \d+ seconds/i, message: 'Çok kısa aralıklarla kod isteniyor, birazdan tekrar dene.' },
  { pattern: /password should be at least/i, message: 'Şifre en az 6 karakter olmalı.' },
];

export function mapAuthErrorMessage(rawMessage) {
  const msg = String(rawMessage || '');
  const match = AUTH_ERROR_MAP.find((m) => m.pattern.test(msg));
  return match ? match.message : GENERIC_MESSAGE;
}
