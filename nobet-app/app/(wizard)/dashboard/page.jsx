import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSchoolForUser, getSchoolRotationMode } from '@/lib/db/schoolContext';
import { getTeachers } from '@/lib/db/teachers';
import { getDutyZones } from '@/lib/db/dutyZones';
import { getHolidays } from '@/lib/db/calendarDays';
import { getActiveHardRuleKeys } from '@/lib/db/rules';
import { getSubscriptionForSchool } from '@/lib/db/subscriptions';
import { isPlatformAdmin } from '@/lib/db/platformAdmin';
import Dashboard from './Dashboard';
import ImpersonationBanner from './ImpersonationBanner';

// Tek sayfa: kullanıcı "5 ayrı sayfa çok karmaşık, eski gibi tek sayfa
// olsun" dedi. Bu sayfa artık tüm sekmelerin (Öğretmenler/Bölgeler/
// Program/Kurallar/Hesabım) ilk verisini burada tek seferde çekip
// Dashboard'a (istemci taraflı sekme sarmalayıcısı) veriyor.

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // getSchoolForUser artık impersonation'a duyarlı (bkz.
  // lib/db/schoolContext.js) — platform_admins üyesi AKTİF bir
  // impersonation başlattıysa (bkz. app/super-admin/actions/impersonation.js)
  // hedef okulu döner, aksi halde (normal kullanıcı gibi) null döner.
  // SADECE null dönerse VE kullanıcı admin ise /super-admin'e atılır —
  // "hiçbir koşulda /dashboard'a düşmesin" kuralı impersonation
  // OLMADIĞI sürece aynen geçerli, tek fark admin bilerek impersonation
  // başlattıysa artık buraya girebiliyor.
  const school = await getSchoolForUser(supabase, user.id);
  if (!school) {
    const isAdmin = await isPlatformAdmin(supabase).catch(() => false);
    if (isAdmin) redirect('/super-admin');
    return (
      <main style={{ maxWidth: 600, margin: '60px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
        <h1>Henüz bir okula bağlı değilsin.</h1>
      </main>
    );
  }

  const [teachers, zones, rotationMode, holidays, activeRuleKeys, subscription] = await Promise.all([
    getTeachers(supabase, school.schoolId),
    getDutyZones(supabase, school.schoolId),
    getSchoolRotationMode(supabase, school.schoolId),
    getHolidays(supabase, school.schoolId),
    getActiveHardRuleKeys(supabase, school.schoolId),
    getSubscriptionForSchool(supabase, school.schoolId),
  ]);

  return (
    <>
      {school.isImpersonating && (
        <ImpersonationBanner label={school.impersonatedOwnerFullName || school.impersonatedOwnerEmail || school.schoolName} />
      )}
      <Dashboard
        schoolName={school.schoolName}
        initialPrincipalName={school.principalName}
        initialAssistantPrincipalName={school.assistantPrincipalName}
        initialTeachers={teachers}
        initialZones={zones}
        initialRotationMode={rotationMode}
        initialHolidays={holidays}
        initialActiveRuleKeys={[...activeRuleKeys]}
        initialSubscription={subscription}
      />
    </>
  );
}
