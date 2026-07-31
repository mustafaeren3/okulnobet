import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/db/platformAdmin';

// TÜM /super-admin/* rotalarının (panel VE /mfa) ortak dış katmanı —
// SADECE "giriş yapmış + platform_admins üyesi" kontrolü burada.
// AAL2 (MFA) kontrolü BİLEREK burada değil, app/super-admin/(panel)/layout.jsx'te
// — aksi halde /super-admin/mfa'nın kendisi de aal2 isterdi ve kimse MFA
// kurulumuna hiç ulaşamazdı (yönlendirme döngüsü).
export default async function SuperAdminRootLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let isAdmin = false;
  try {
    isAdmin = await isPlatformAdmin(supabase);
  } catch {
    isAdmin = false;
  }
  if (!isAdmin) redirect('/dashboard');

  return children;
}
