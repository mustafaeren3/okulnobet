import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAAL } from '@/lib/db/platformAdmin';
import { isDevEnvironment } from '@/lib/env';
import SidebarNav from '../components/SidebarNav';
import LogoutButton from '../components/LogoutButton';
import InactivityGuard from '../components/InactivityGuard';
import Logo from '../../components/Logo';
import Badge from '../../components/Badge';
import '../admin.css';

// GERÇEK panel içeriğinin katmanı — üst katman (app/super-admin/layout.jsx)
// zaten "giriş yapmış + platform_admins üyesi" kontrolünü yaptı, burada
// EK olarak aal2 (MFA tamamlanmış mı) kontrol edilir. /super-admin/mfa bu
// route group'un DIŞINDA olduğu için (kardeş klasör) buradaki guard'dan
// etkilenmez — yönlendirme döngüsü olmaz.
export default async function AdminPanelLayout({ children }) {
  const supabase = createClient();

  // Geliştirme ortamında (next dev) MFA ekranına yönlendirme yapılmaz —
  // dış katmanın "giriş yapmış + platform_admins üyesi" kontrolü yeterli
  // sayılır. Production'da aal2 şartı aynen geçerli.
  if (!isDevEnvironment()) {
    let aal = null;
    try {
      aal = await getCurrentAAL(supabase);
    } catch {
      aal = null;
    }
    if (aal !== 'aal2') redirect('/super-admin/mfa');
  }

  return (
    <div className="admin-root">
      <InactivityGuard />
      <aside className="admin-sidebar">
        <div className="logo"><Logo size={26} /><span>OkulNöbet</span></div>
        <Badge variant="primary" className="admin-sidebar-badge">SÜPER ADMIN</Badge>
        <SidebarNav />
      </aside>
      <div className="admin-content">
        <div className="admin-topbar">
          <span className="school-name">Platform Yönetimi</span>
          <LogoutButton />
        </div>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
