// Merkezi limit-muafiyeti politikası. Saf fonksiyon — DB/Next.js bilmez.
//
// BİLİNÇLİ TASARIM KARARI: kod içinde dağınık "if (isOwner) { ... }"
// veya "if (isPlatformAdmin) return early" dallanmaları YASAK (CLAUDE.md
// sadelik kuralı + kullanıcı isteği: "if owner ise geç mantığı yerine
// policy mantığı kullan"). Bunun yerine TEK bir üretim noktası var:
// lib/db/subscriptions.js:getSubscriptionForSchool() muafiyet durumunda
// bu overlay'i uyguluyor — ondan SONRA akan her şey (isPremium,
// canAccessFeature, requireUsableSubscription, requireCanGenerateSchedule)
// zaten "abonelik aktif/standard" görüyor, KENDİ kodunda hiçbir owner
// kontrolü yapmıyor/yapmasına gerek kalmıyor. Yeni bir limit eklenirse
// (ör. ileride "aylık X program" gibi), o limit de subscription objesi
// üzerinden okuyorsa OTOMATİK olarak bu muafiyetten faydalanır — ayrı
// bir yerde tekrar "owner mı?" sorması gerekmez.
//
// NOT (bilerek kapsam dışı): rate-limit (login/MFA/admin brute-force
// koruması, bkz. lib/db/rateLimit.js) bu politikanın KAPSAMINDA DEĞİL —
// o bir iş/ticari kısıt değil, hesabın kendisini kimlik doğrulama
// saldırılarından koruyan bir güvenlik kontrolü; süper admin hesabı için
// bile devre dışı bırakmak güvenlik zafiyeti yaratır, "sınırsız test"
// isteğinin kapsadığı bir şey değildir.
export function applyUnlimitedOverlay(subscription) {
  return {
    school_id: null,
    free_generation_quota: 999999,
    free_generation_used: 0,
    ...(subscription || {}),
    status: 'active',
    plan_type: 'enterprise',
    current_period_end: null,
    _policyOverlay: true,
  };
}
