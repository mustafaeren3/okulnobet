'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
  );
}
