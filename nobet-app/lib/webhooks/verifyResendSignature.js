import { createHmac, timingSafeEqual } from 'node:crypto';

// Resend webhook'ları Svix altyapısını kullanıyor (kendi imzalama şeması
// değil) — svix kütüphanesi EKLENMEDİ (CLAUDE.md sadelik kuralı: tek
// kullanımlık, ~20 satırlık bir HMAC doğrulaması için yeni bir bağımlılık
// gerekmiyor, Node'un yerleşik crypto'su yeterli — tests/db/helpers.js'teki
// TOTP fonksiyonu da aynı gerekçeyle yerleşik crypto kullanıyor).
//
// Algoritma (Svix'in resmi "manual verification" şeması):
//   1. secret "whsec_<base64>" formatında — base64 kısmı çözülüp ham byte'a çevrilir.
//   2. imzalanan içerik: `${svix-id}.${svix-timestamp}.${ham body}`
//   3. HMAC-SHA256(secret_bytes, içerik), sonuç base64.
//   4. svix-signature header'ı "v1,<base64>" biçiminde, BOŞLUKLA ayrılmış
//      birden fazla imza içerebilir (secret rotasyonu için) — herhangi
//      biriyle eşleşme yeterli.
// Saf fonksiyon — I/O yok, ağ/DB bilmiyor, tests/unit'te doğrudan test edilir.
export function verifyResendSignature({ svixId, svixTimestamp, svixSignature, body, secret, toleranceSeconds = 300 }) {
  if (!svixId || !svixTimestamp || !svixSignature || !secret || body === undefined || body === null) {
    return false;
  }

  const timestampSeconds = Number(svixTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    return false; // replay koruması — eski/gelecek tarihli istekler reddedilir
  }

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const expectedSignature = createHmac('sha256', secretBytes).update(signedContent).digest('base64');
  const expectedBuffer = Buffer.from(expectedSignature, 'base64');

  const candidates = svixSignature.split(' ').map((part) => part.split(',')[1]).filter(Boolean);

  return candidates.some((candidate) => {
    let candidateBuffer;
    try {
      candidateBuffer = Buffer.from(candidate, 'base64');
    } catch {
      return false;
    }
    if (candidateBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(candidateBuffer, expectedBuffer);
  });
}
