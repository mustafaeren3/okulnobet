'use client';

import { useRef, useState } from 'react';

// Dashboard.jsx'teki orijinal showToast(msg, isErr) imzasıyla birebir uyumlu —
// çağıran kod hiç değişmeden bu hook'a taşınabiliyor.
export function useToast() {
  const timer = useRef(null);
  const [toast, setToast] = useState({ msg: '', isErr: false, visible: false });

  function showToast(msg, isErr = false) {
    setToast({ msg, isErr, visible: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  return { toast, showToast };
}
