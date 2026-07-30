import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSchoolForUser, getSchoolRotationMode } from '@/lib/db/schoolContext';
import { getTeachers } from '@/lib/db/teachers';
import { getDutyZones } from '@/lib/db/dutyZones';
import { getHolidays } from '@/lib/db/calendarDays';
import { getActiveHardRuleKeys } from '@/lib/db/rules';
import { getSubscriptionForSchool } from '@/lib/db/subscriptions';
import Dashboard from './Dashboard';

// Tek sayfa: kullanıcı "5 ayrı sayfa çok karmaşık, eski gibi tek sayfa
// olsun" dedi. Bu sayfa artık tüm sekmelerin (Öğretmenler/Bölgeler/
// Program/Kurallar/Hesabım) ilk verisini burada tek seferde çekip
// Dashboard'a (istemci taraflı sekme sarmalayıcısı) veriyor.

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const school = await getSchoolForUser(supabase, user.id);
  if (!school) {
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
  );
}
