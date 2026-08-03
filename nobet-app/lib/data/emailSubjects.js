// Bu iki sabit supabase/config.toml içindeki [auth.email.template.confirmation]/
// [auth.email.template.recovery] subject alanlarıyla BİREBİR AYNI olmalı.
// NEDEN: app/api/webhooks/resend/route.js, GoTrue'nun SMTP ile gönderdiği bir
// mailin "confirmation" mı "recovery" mi olduğunu Resend'in webhook payload'ından
// BAŞKA hiçbir sinyalle bilemiyor (bkz. o dosyanın başındaki mimari not) —
// tek ayırt edici, mailin konu satırı. TOML dosyası bu JS sabitini import
// edemediği için (ayrı format) iki yerde elle senkron tutuluyor; biri
// değişirse diğeri de değişmeli.
export const CONFIRMATION_EMAIL_SUBJECT = 'OkulNöbet — E-posta Doğrulama Kodun';
export const RECOVERY_EMAIL_SUBJECT = 'OkulNöbet — Şifre Sıfırlama Kodun';
