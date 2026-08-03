'use client';

import { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { resendEmailAction, getEmailLogEventsAction } from '../../actions/emailLog';

const MAIL_TYPE_RESEND_LABEL = { confirmation: 'Doğrulama Mailini Tekrar Gönder', recovery: 'Reset Mailini Tekrar Gönder' };

// Her satırın "tekrar gönder" + "detay" eylemleri — DataTable saf Server
// Component olduğu için (bkz. ui/data-table.jsx notu) tıklanabilir kısım
// tek bir client "ada" olarak burada izole edildi.
export default function EmailLogRowActions({ row }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [events, setEvents] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  async function handleResend() {
    setBusy(true);
    setMsg('');
    const res = await resendEmailAction(row.email, row.mail_type);
    setBusy(false);
    setMsg(res?.error || 'Gönderildi.');
  }

  async function toggleDetail() {
    if (!showDetail && events === null) {
      setLoadingEvents(true);
      const res = await getEmailLogEventsAction(row.id);
      setLoadingEvents(false);
      setEvents(res?.events || []);
    }
    setShowDetail((v) => !v);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <Button type="button" variant="outline" size="sm" onClick={handleResend} disabled={busy} title={MAIL_TYPE_RESEND_LABEL[row.mail_type]}>
          <RefreshCw size={12} /> {busy ? '...' : 'Tekrar Gönder'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={toggleDetail}>
          {showDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Detay
        </Button>
      </div>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}

      {showDetail && (
        <div className="mt-1 w-64 rounded border border-border bg-muted/30 p-2 text-xs">
          <div className="mb-1 flex flex-col gap-0.5">
            <span>IP: {row.ip || '—'}</span>
            <span className="truncate">UA: {row.user_agent || '—'}</span>
            <span>Provider: {row.provider}</span>
            <span className="truncate">Message ID: {row.provider_message_id || '—'}</span>
            {row.failure_reason && <span className="text-destructive">Neden: {row.failure_reason}</span>}
          </div>
          <div className="mb-1 font-medium">Olay geçmişi</div>
          {loadingEvents ? (
            <div>Yükleniyor...</div>
          ) : events && events.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="font-normal">Olay</th>
                  <th className="font-normal">Zaman</th>
                  <th className="font-normal">Event ID</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{e.event_type}</td>
                    <td>{new Date(e.occurred_at).toLocaleString('tr-TR')}</td>
                    <td className="max-w-[90px] truncate" title={e.provider_event_id}>{e.provider_event_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>Henüz webhook olayı yok.</div>
          )}
        </div>
      )}
    </div>
  );
}
