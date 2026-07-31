'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSchoolId } from '@/lib/db/schoolContext';
import { createPurchaseIntent } from '@/lib/db/purchaseIntents';
import { getSubscriptionForSchool } from '@/lib/db/subscriptions';
import { createCheckoutSession } from '@/lib/payments/provider';

// PremiumScreen'deki "Premium'a Geç" CTA'sı. Önce gerçek bir ödeme
// sağlayıcısı bağlı mı diye sorar (bkz. lib/payments/provider.js) —
// bağlıysa çıkış (checkout) URL'i döner ve çağıran oraya yönlendirir.
// Şu an tek implementasyon (lib/payments/mock.js) her zaman null
// döndüğü için pratikte hep aşağıdaki "talep kaydı" akışına düşülür;
// gerçek bir sağlayıcı bağlanınca bu dosyada değişiklik gerekmez.
export async function requestPremiumUpgrade({ contactName, contactPhone, note } = {}) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const subscription = await getSubscriptionForSchool(supabase, schoolId);

    const session = await createCheckoutSession(subscription, 'standard');
    if (session?.url) {
      return { checkoutUrl: session.url };
    }

    await createPurchaseIntent(supabase, schoolId, { contactName, contactPhone, note });
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
