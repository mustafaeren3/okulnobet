import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAAL } from '@/lib/db/platformAdmin';
import MfaScreen from './MfaScreen';

// aal1 bir admin oturumunu aal2'ye çıkaran ekran. Giriş + platform_admins
// üyeliği kontrolü artık üst katmanda (app/super-admin/layout.jsx) — burada
// sadece "zaten aal2 mi" bakılır.
export default async function SuperAdminMfaPage() {
  const supabase = createClient();

  let aal = null;
  try {
    aal = await getCurrentAAL(supabase);
  } catch {
    aal = null;
  }
  if (aal === 'aal2') redirect('/super-admin');

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = (factorsData?.totp || []).find((f) => f.status === 'verified');

  return <MfaScreen mode={verifiedTotp ? 'challenge' : 'enroll'} factorId={verifiedTotp?.id || null} />;
}
