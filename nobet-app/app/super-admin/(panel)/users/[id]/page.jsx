import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getSchoolDetail } from '@/lib/db/platformAdmin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import UserActions from './UserActions';
import NoteForm from './NoteForm';

const STATUS_VARIANT = { active: 'success', past_due: 'warning', expired: 'destructive', cancelled: 'outline', frozen: 'destructive' };
const STATUS_LABEL = { active: 'Aktif', past_due: 'Ödeme Gecikti', expired: 'Süresi Doldu', cancelled: 'İptal', frozen: 'Dondurulmuş' };
const PLAN_LABEL = { free: 'Ücretsiz (Trial)', standard: 'Standart', enterprise: 'Kurumsal' };

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// Server Component — tek RPC (platform_get_school_detail, zaten var olan)
// tek round-trip'te okul + kullanıcı + abonelik + son üretimler + ödemeler +
// admin notlarını dönüyor. Mutasyonlar (dondur/aktif et/premium/trial/not)
// mevcut, zaten test edilmiş action'lardan (app/super-admin/actions/
// subscriptions.js, schools.js) geçiyor — burada YENİDEN yazılmadı.
export default async function UserDetailPage({ params }) {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);

  const detail = await getSchoolDetail(supabase, params.id);
  if (!detail) notFound();

  const sub = detail.subscription || {};
  const owner = detail.users?.[0] || {};
  const isPremium = sub.status === 'active' && ['standard', 'enterprise'].includes(sub.plan_type);
  const isTrial = sub.plan_type === 'free';

  return (
    <div className="flex flex-col gap-4">
      <Link href="/super-admin/users" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Kullanıcılara dön
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-lg text-foreground">{owner.full_name || '(Ad soyad girilmemiş)'}</CardTitle>
              <CardDescription>{owner.email}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={STATUS_VARIANT[sub.status] || 'outline'}>{STATUS_LABEL[sub.status] || sub.status || '—'}</Badge>
              <Badge variant={isTrial ? 'secondary' : 'default'}>{PLAN_LABEL[sub.plan_type] || sub.plan_type || '—'}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <InfoRow label="Okul" value={detail.school.name} />
            <InfoRow label="İl / İlçe" value={`${detail.school.district} / ${detail.school.city}`} />
            <InfoRow label="Kayıt Tarihi" value={formatDateTime(owner.created_at || detail.school.created_at)} />
            <InfoRow label="Son Giriş" value={formatDateTime(owner.last_sign_in_at)} />
            <InfoRow label="Toplam Öğretmen" value={detail.teacher_count} />
            <InfoRow label="Toplam Nöbet" value={detail.total_duty_count} />
            <InfoRow label="Elle Değiştirilen Nöbet" value={detail.manual_change_count} />
            {isTrial && <InfoRow label="Ücretsiz Kullanım Kotası" value={`${sub.free_generation_used ?? 0} / ${sub.free_generation_quota ?? '—'}`} />}
            {sub.trial_ends_at && <InfoRow label="Trial Bitiş" value={formatDateTime(sub.trial_ends_at)} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İşlemler</CardTitle>
            <CardDescription>Bu kullanıcının hesabı/aboneliği üzerinde işlem yap.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserActions schoolId={detail.school.id} status={sub.status} isPremium={isPremium} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Notları</CardTitle>
          <CardDescription>Bu kullanıcı hakkında sadece süper adminlerin gördüğü notlar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <NoteForm schoolId={detail.school.id} />
          {(detail.admin_notes || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">Henüz not eklenmemiş.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {detail.admin_notes.map((n) => (
                <div key={n.id} className="rounded-md border border-border p-3 text-sm">
                  <div>{n.note}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{n.admin_email} · {formatDateTime(n.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
