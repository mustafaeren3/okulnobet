import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSchoolForUser } from '@/lib/db/schoolContext';
import { getTeachers } from '@/lib/db/teachers';
import TeachersManager from './TeachersManager';

export default async function TeachersPage() {
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

  const teachers = await getTeachers(supabase, school.schoolId);

  return (
    <TeachersManager
      schoolId={school.schoolId}
      schoolName={school.schoolName}
      initialTeachers={teachers}
    />
  );
}
