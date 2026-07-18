'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSubscriptionStatus } from '@/lib/engine/subscription';
import './account.css';

export default function AccountManager({ schoolName, subscription }) {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const status = subscription
    ? getSubscriptionStatus({
        status: subscription.status,
        trialEndsAt: subscription.trial_ends_at,
        currentPeriodEnd: subscription.current_period_end,
      })
    : null;

  return (
    <div className="account-root">
      <header>
        <h1>👤 Hesabım</h1>
        <div className="school-name">{schoolName}</div>
        <button className="account-btn" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={handleLogout}>
          Çıkış Yap
        </button>
      </header>

      <div className="account-card">
        <h3>Abonelik Durumu</h3>
        {!status ? (
          <div className="account-empty">Abonelik bilgisi bulunamadı.</div>
        ) : (
          <>
            <div className={`account-status-badge ${status.isUsable ? '' : 'account-status-badge-warn'}`}>
              {status.label}
            </div>
            {status.daysRemaining !== null && (
              <div className="account-days">
                {status.isUsable
                  ? `${status.daysRemaining} gün kaldı`
                  : 'Kullanım için ödeme gerekiyor'}
              </div>
            )}
            <div className="account-info-box">
              💡 Şu an ödeme entegrasyonu henüz aktif değil — deneme süresi sona erdiğinde nasıl
              devam edeceğine dair bilgilendirme ayrıca yapılacak.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
