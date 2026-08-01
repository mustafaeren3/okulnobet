'use client';

// useToast()'un ürettiği { msg, isErr, visible } state'ini render eder.
export default function Toast({ toast }) {
  if (!toast?.msg) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={['toast', toast.visible ? 'toast-visible' : '', toast.isErr ? 'toast-danger' : 'toast-success'].filter(Boolean).join(' ')}
    >
      {toast.msg}
    </div>
  );
}
