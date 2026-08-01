'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Snowflake, PlayCircle, Crown, Ban, CalendarClock } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../ui/dialog';
import { freeze, reopen, updateSubscription, extendTrial } from '../../../actions/subscriptions';

// Her aksiyon zaten var olan, test edilmiş server action'ları çağırıyor
// (bkz. app/super-admin/actions/subscriptions.js) — burada YENİ bir RPC/
// mutasyon YOK, sadece shadcn Dialog ile "sebep" (reason) toplayıp
// mevcut fonksiyonlara geçiyor. Hesap SİLME bilerek yok — service_role
// key gerektiriyor, bu depoda yok.
const ACTIONS = {
  freeze: { label: 'Hesabı Dondur', icon: Snowflake, needsReason: true, run: (id, reason) => freeze(id, reason) },
  reopen: { label: 'Hesabı Tekrar Aktif Et', icon: PlayCircle, needsReason: true, run: (id, reason) => reopen(id, reason) },
  makePremium: { label: 'Premium Yap', icon: Crown, needsReason: true, run: (id, reason) => updateSubscription(id, { status: 'active', planType: 'standard', reason }) },
  removePremium: { label: 'Premium Kaldır', icon: Ban, needsReason: true, run: (id, reason) => updateSubscription(id, { status: 'active', planType: 'free', reason }) },
  extendTrial: { label: 'Trial Süresini Uzat', icon: CalendarClock, needsReason: true, needsDays: true, run: (id, reason, days) => extendTrial(id, Number(days), reason) },
};

export default function UserActions({ schoolId, status, isPremium }) {
  const router = useRouter();
  const [openAction, setOpenAction] = useState(null);
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('30');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function openDialog(key) {
    setOpenAction(key);
    setReason('');
    setDays('30');
    setError('');
  }

  async function handleConfirm() {
    const action = ACTIONS[openAction];
    if (!reason.trim()) { setError('Sebep girmeniz gerekiyor.'); return; }
    setBusy(true);
    setError('');
    const res = await action.run(schoolId, reason.trim(), days);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setOpenAction(null);
    router.refresh();
  }

  const buttons = [
    status !== 'frozen' && 'freeze',
    status === 'frozen' && 'reopen',
    !isPremium && 'makePremium',
    isPremium && 'removePremium',
    'extendTrial',
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-2">
      {buttons.map((key) => {
        const { label, icon: Icon } = ACTIONS[key];
        return (
          <Button key={key} variant="outline" className="justify-start" onClick={() => openDialog(key)}>
            <Icon size={15} /> {label}
          </Button>
        );
      })}

      <Dialog open={openAction !== null} onOpenChange={(open) => !open && setOpenAction(null)}>
        <DialogContent>
          {openAction && (
            <>
              <DialogHeader>
                <DialogTitle>{ACTIONS[openAction].label}</DialogTitle>
                <DialogDescription>Bu işlem audit log'a kaydedilecek — bir sebep girin.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="action-reason">Sebep</Label>
                  <Input id="action-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Örn. Müşteri talebi, ödeme onayı..." autoFocus />
                </div>
                {ACTIONS[openAction].needsDays && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="action-days">Kaç gün uzatılsın</Label>
                    <Input id="action-days" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
                  </div>
                )}
                {error && <div className="text-sm text-destructive">{error}</div>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenAction(null)} disabled={busy}>Vazgeç</Button>
                <Button onClick={handleConfirm} disabled={busy}>{busy ? 'Uygulanıyor...' : 'Onayla'}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
