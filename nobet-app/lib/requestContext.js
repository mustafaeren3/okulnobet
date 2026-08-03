import { headers } from 'next/headers';

// SADECE gözlemlenebilirlik/audit amaçlı (Email Merkezi'nde gösterim) —
// güvenlik kararı (rate limit vb.) için KULLANILMAZ. NEDEN: mevcut
// login/actions.js zaten şunu belirlemiş: "Next.js Server Action'larında
// istemci IP'sine güvenilir biçimde erişim yok" (x-forwarded-for
// spoofable) — bu yüzden checkRateLimit hâlâ e-postayı anahtar alıyor,
// IP'yi değil. Burada aynı sınırla, sadece daha düşük bahisli bir amaç
// için (kim hangi mailin gönderilmesini tetikledi kaydı) kullanılıyor.
export function getClientContext() {
  const h = headers();
  const forwardedFor = h.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  const userAgent = h.get('user-agent');
  return { ip, userAgent };
}
