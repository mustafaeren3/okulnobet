import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSchoolForUser } from '@/lib/db/schoolContext';
import { getSubscriptionForSchool } from '@/lib/db/subscriptions';
import AccountManager from './AccountManager';

export default async function AccountPage() {
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

  const subscription = await getSubscriptionForSchool(supabase, school.schoolId);

  return <AccountManager schoolName={school.schoolName} subscription={subscription} />;
}
