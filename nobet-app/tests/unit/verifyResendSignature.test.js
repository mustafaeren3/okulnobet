import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyResendSignature } from '@/lib/webhooks/verifyResendSignature';

// Test secret — gerçek bir Resend sırrı değil, sadece "whsec_<base64>"
// biçimini taklit ediyor.
const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

function sign(id, timestamp, body, secret = SECRET) {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${id}.${timestamp}.${body}`;
  const sig = createHmac('sha256', secretBytes).update(signedContent).digest('base64');
  return `v1,${sig}`;
}

describe('verifyResendSignature', () => {
  const body = JSON.stringify({ type: 'email.sent', data: { email_id: 'abc' } });
  const id = 'msg_test123';

  it('geçerli imzayı kabul eder', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign(id, timestamp, body);
    expect(verifyResendSignature({ svixId: id, svixTimestamp: timestamp, svixSignature: signature, body, secret: SECRET })).toBe(true);
  });

  it('birden fazla imza varsa (rotasyon) herhangi biriyle eşleşmeyi kabul eder', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const real = sign(id, timestamp, body);
    const fakeExtra = 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    expect(verifyResendSignature({ svixId: id, svixTimestamp: timestamp, svixSignature: `${fakeExtra} ${real}`, body, secret: SECRET })).toBe(true);
  });

  it('yanlış secret ile üretilen imzayı reddeder', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign(id, timestamp, body, 'whsec_yanlisSecretBase64EncodedXXXXXXXX');
    expect(verifyResendSignature({ svixId: id, svixTimestamp: timestamp, svixSignature: signature, body, secret: SECRET })).toBe(false);
  });

  it('body değişirse (tampering) imzayı reddeder', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign(id, timestamp, body);
    const tamperedBody = body.replace('email.sent', 'email.delivered');
    expect(verifyResendSignature({ svixId: id, svixTimestamp: timestamp, svixSignature: signature, body: tamperedBody, secret: SECRET })).toBe(false);
  });

  it('svix-id değişirse imzayı reddeder', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign(id, timestamp, body);
    expect(verifyResendSignature({ svixId: 'msg_farkli', svixTimestamp: timestamp, svixSignature: signature, body, secret: SECRET })).toBe(false);
  });

  it('tolerans dışındaki (eski) timestamp\'i reddeder — replay koruması', () => {
    const oldTimestamp = String(Math.floor(Date.now() / 1000) - 3600); // 1 saat önce
    const signature = sign(id, oldTimestamp, body);
    expect(verifyResendSignature({ svixId: id, svixTimestamp: oldTimestamp, svixSignature: signature, body, secret: SECRET, toleranceSeconds: 300 })).toBe(false);
  });

  it('eksik header varsa reddeder', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    expect(verifyResendSignature({ svixId: null, svixTimestamp: timestamp, svixSignature: 'v1,xxx', body, secret: SECRET })).toBe(false);
    expect(verifyResendSignature({ svixId: id, svixTimestamp: timestamp, svixSignature: null, body, secret: SECRET })).toBe(false);
  });

  it('secret hiç yoksa reddeder (yapılandırma eksikse fail-closed)', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign(id, timestamp, body);
    expect(verifyResendSignature({ svixId: id, svixTimestamp: timestamp, svixSignature: signature, body, secret: '' })).toBe(false);
  });
});
