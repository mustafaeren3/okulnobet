'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { endImpersonationAction } from '../../super-admin/actions/impersonation';

// Impersonation sırasında ekranın en üstünde SABİT görünen uyarı — admin
// hangi kullanıcı/okulun verisine baktığını/düzenlediğini HER an görsün.
// "Süper Admin'e geri dön" tek tıkla platform_end_impersonation() RPC'sini
// çağırıp /super-admin'e döner (bkz. app/super-admin/actions/impersonation.js).
export default function ImpersonationBanner({ label }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleExit() {
    setBusy(true);
    await endImpersonationAction();
  }

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 1000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 12, padding: '10px 16px', background: '#7c2d12',
        color: '#fff', fontSize: 13, fontWeight: 600, flexWrap: 'wrap',
      }}
    >
      <AlertTriangle size={16} />
      <span>Şu anda <strong>{label}</strong> kullanıcısı olarak işlem yapıyorsunuz.</span>
      <button
        onClick={handleExit}
        disabled={busy}
        style={{
          background: '#fff', color: '#7c2d12', border: 'none', borderRadius: 6,
          padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {busy ? 'Çıkılıyor...' : "Süper Admin'e Geri Dön"}
      </button>
    </div>
  );
}
