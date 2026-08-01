'use client';

import { useCallback, useRef, useState } from 'react';

// Dashboard.jsx'teki orijinal showToast(msg, isErr) imzasıyla birebir uyumlu —
// çağıran kod hiç değişmeden bu hook'a taşınabiliyor.
// useCallback ile sarılı: referansı render'lar arasında sabit kalsın diye —
// aksi halde bunu bağımlılık olarak kullanan her useCallback/useMemo
// (ör. Dashboard.jsx'teki TeacherRow memoizasyonu) her render'da bozulurdu.
export function useToast() {
  const timer = useRef(null);
  const [toast, setToast] = useState({ msg: '', isErr: false, visible: false });

  const showToast = useCallback((msg, isErr = false) => {
    setToast({ msg, isErr, visible: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, []);

  return { toast, showToast };
}
