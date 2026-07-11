import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Dashboard from './Dashboard';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: schoolUser } = await supabase
    .from('school_users')
    .select('school_id, role, schools(name, city, district)')
    .eq('user_id', user.id)
    .single();

  if (!schoolUser) {
    return (
      <main style={{ maxWidth: 600, margin: '60px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
        <h1>Henüz bir okula bağlı değilsin.</h1>
      </main>
    );
  }

  const schoolId = schoolUser.school_id;

  const [{ data: staff }, { data: locations }, { data: holidays }, { data: settings }] = await Promise.all([
    supabase.from('staff').select('*').eq('school_id', schoolId).order('created_at'),
    supabase.from('locations').select('*').eq('school_id', schoolId).order('created_at'),
    supabase.from('holidays').select('*').eq('school_id', schoolId),
    supabase.from('settings').select('*').eq('school_id', schoolId).single(),
  ]);

  return (
    <Dashboard
      schoolId={schoolId}
      schoolName={schoolUser.schools?.name}
      initialPersons={staff || []}
      initialLocations={locations || []}
      initialHolidays={holidays || []}
      initialSettings={settings || null}
    />
  );
}
