import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTeachers } from '@/lib/db/teachers';
import TeachersManager from './TeachersManager';

export default async function TeachersPage() {
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
  const teachers = await getTeachers(supabase, schoolId);

  return (
    <TeachersManager
      schoolId={schoolId}
      schoolName={schoolUser.schools?.name}
      initialTeachers={teachers}
    />
  );
}
