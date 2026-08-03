import { NextResponse } from 'next/server';
import { verifyResendSignature } from '@/lib/webhooks/verifyResendSignature';
import { recordEmailEvent } from '@/lib/db/emailLog';
import { createAdminClient } from '@/lib/supabase/admin';
import { CONFIRMATION_EMAIL_SUBJECT, RECOVERY_EMAIL_SUBJECT } from '@/lib/data/emailSubjects';

// Resend'in bu projede GERÇEKTEN tetiklediği/desteklediği olaylar. Diğer
// event tipleri (email.scheduled, email.suppressed, email.received —
// gelen kutusu/zamanlanmış gönderim, bu üründe kullanılmıyor) sessizce
// 200 ile onaylanır ama email_log'a YAZILMAZ — "uydurma" yasağı: sadece
// GERÇEKTEN işlediğimiz olaylar kaydediliyor.
const HANDLED_EVENTS = new Set([
  'email.sent',
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
  'email.delivery_delayed',
  'email.failed',
]);

function inferMailType(subject) {
  if (subject === CONFIRMATION_EMAIL_SUBJECT) return 'confirmation';
  if (subject === RECOVERY_EMAIL_SUBJECT) return 'recovery';
  return null;
}

// Resend'in email.bounced/email.failed/email.complained için ayrı alt
// nesne şeması dokümante — SADECE bounce için tam doğrulandı (bkz. rapor):
// { data: { bounce: { message, subType, type } } }. failed/complained için
// resmi dokümantasyonda tam alan adı bulunamadı — bu yüzden burada
// TAHMİN edilmiyor: birkaç makul yol denenir, hiçbiri tutmazsa null
// kalır. Ham payload HER ZAMAN email_log_events.raw_payload'a eksiksiz
// yazılıyor (bkz. lib/db/emailLog.js) — bu alan sadece kolaylık, gerçek
// kaynak her zaman ham JSON.
function extractFailureReason(data) {
  return data?.bounce?.message || data?.failed?.reason || data?.complaint?.type || null;
}

export async function POST(request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Yapılandırma eksikse fail-closed — sessizce kabul etmek yerine
    // açıkça 500 dönülür, üretimde fark edilmeden webhook'un boşa
    // gitmesi engellenir.
    return NextResponse.json({ error: 'Webhook yapılandırılmamış.' }, { status: 500 });
  }

  const body = await request.text(); // RAW body şart — imza buna göre hesaplanıyor
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  const valid = verifyResendSignature({ svixId, svixTimestamp, svixSignature, body, secret });
  if (!valid) {
    return NextResponse.json({ error: 'Geçersiz imza.' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }

  const eventType = payload?.type;
  if (!HANDLED_EVENTS.has(eventType)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = payload?.data || {};
  const toEmail = Array.isArray(data.to) ? data.to[0] : data.to;
  const mailTypeHint = inferMailType(data.subject);

  const adminClient = createAdminClient();
  try {
    await recordEmailEvent(adminClient, {
      provider: 'resend',
      providerEventId: svixId,
      providerMessageId: data.email_id || null,
      toEmail: toEmail || null,
      mailTypeHint,
      eventType,
      occurredAt: payload?.created_at || new Date().toISOString(),
      rawPayload: payload,
      failureReason: extractFailureReason(data),
    });
  } catch (error) {
    // 500 dön — Resend bunu yeniden dener (at-least-once), veri kaybı
    // yerine bir sonraki denemede kurtarma şansı olur.
    return NextResponse.json({ error: 'İşlenemedi.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
