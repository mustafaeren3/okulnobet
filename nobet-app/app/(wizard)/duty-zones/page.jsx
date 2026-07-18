import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDutyZones } from '@/lib/db/dutyZones';
import DutyZonesManager from './DutyZonesManager';

export default async function DutyZonesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: schoolUser } = await supabase
    .from('school_users')
    .select('school_id, schools(name)')
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
  const zones = await getDutyZones(supabase, schoolId);

  return (
    <DutyZonesManager
      schoolId={schoolId}
      schoolName={schoolUser.schools?.name}
      initialZones={zones}
    />
  );
}
