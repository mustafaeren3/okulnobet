'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 dakika
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

// O4 bulgusu: admin oturumunda inactivity timeout yoktu. Bu component
// sadece admin panelinde (bkz. (panel)/layout.jsx) render edilir — son
// etkileşimden TIMEOUT_MS sonra oturumu kapatıp /login'e yönlendirir.
// Yeni bir bağımlılık gerekmiyor, düz bir timer.
export default function InactivityGuard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    function resetTimer() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      }, TIMEOUT_MS);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));
    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [supabase, router]);

  return null;
}
