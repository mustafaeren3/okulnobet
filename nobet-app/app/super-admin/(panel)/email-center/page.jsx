import { Mail, Send, XCircle, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/db/platformAdmin';
import { getPlatformEmailLogPage, getPlatformEmailLogStats } from '@/lib/db/emailLog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { StatCard } from '../../ui/stat-card';
import { DataTable } from '../../ui/data-table';
import { PaginationBar } from '../../ui/pagination';
import EmailCenterFilters from './EmailCenterFilters';
import EmailLogRowActions from './EmailLogRowActions';

const MAIL_TYPE_LABEL = { confirmation: 'Doğrulama', recovery: 'Şifre Sıfırlama' };
const STATUS_LABEL = {
  pending: 'Bekliyor', sent: 'Gönderildi', delivered: 'Teslim Edildi', opened: 'Açıldı',
  clicked: 'Tıklandı', verified: 'Doğrulandı', delayed: 'Gecikti', bounced: 'Bounce',
  complained: 'Spam Şikayeti', failed: 'Başarısız',
};
const STATUS_VARIANT = {
  pending: 'outline', sent: 'secondary', delivered: 'success', opened: 'success', clicked: 'success',
  verified: 'success', delayed: 'warning', bounced: 'destructive', complained: 'destructive', failed: 'destructive',
};

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 25;

// Server Component — Users sayfasıyla AYNI desen (URL searchParams tek
// doğruluk kaynağı, sunucu tarafında sayfalama). bkz. migration
// 0054/0057_email_log*.sql.
//
// DÜRÜSTLÜK NOTU (kullanıcı isteği): "Open Rate" Resend'in domain
// ayarında açık takibi etkinse ölçülür — hiç açılma yoksa bu SADECE
// "takip kapalı" mı "gerçekten hiç açılmadı" mı olduğunu ayırt edemez,
// aşağıdaki bilgi kutusunda açıkça belirtiliyor. "Rejected" diye AYRI
// bir Resend olayı YOK — en yakın karşılıklar "Bounce"/"Başarısız",
// uydurma bir durum eklenmedi.
export default async function EmailCenterPage({ searchParams }) {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);

  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.search || null;
  const mailType = searchParams.mailType && searchParams.mailType !== 'all' ? searchParams.mailType : null;
  const status = searchParams.status && searchParams.status !== 'all' ? searchParams.status : null;
  const dateFrom = searchParams.dateFrom || null;
  const dateTo = searchParams.dateTo || null;

  const [rows, stats] = await Promise.all([
    getPlatformEmailLogPage(supabase, {
      search, mailType, status,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
      dateTo: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : null,
      page, pageSize: PAGE_SIZE,
    }),
    getPlatformEmailLogStats(supabase),
  ]);
  const totalCount = rows[0]?.total_count ? Number(rows[0].total_count) : 0;

  function buildHref(targetPage) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (mailType) params.set('mailType', mailType);
    if (status) params.set('status', status);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return qs ? `/super-admin/email-center?${qs}` : '/super-admin/email-center';
  }

  const columns = [
    { key: 'created_at', header: 'Gönderim Zamanı', cell: (r) => <span className="text-xs">{formatDateTime(r.created_at)}</span> },
    {
      key: 'email', header: 'Kullanıcı / Okul',
      cell: (r) => (
        <div>
          <div className="font-medium">{r.email}</div>
          <div className="text-xs text-muted-foreground">{r.full_name || '—'} {r.school_name ? `· ${r.school_name}` : ''}</div>
        </div>
      ),
    },
    { key: 'mail_type', header: 'Mail Türü', cell: (r) => <Badge variant="outline">{MAIL_TYPE_LABEL[r.mail_type] || r.mail_type}</Badge> },
    { key: 'status', header: 'Durum', cell: (r) => <Badge variant={STATUS_VARIANT[r.status] || 'outline'}>{STATUS_LABEL[r.status] || r.status}</Badge> },
    { key: 'provider', header: 'Sağlayıcı', cell: (r) => <span className="text-xs text-muted-foreground">{r.provider}</span> },
    { key: 'actions', header: '', cell: (r) => <EmailLogRowActions row={r} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Mail} label="Bugün Gönderilen" value={stats.sent_today ?? 0} />
        <StatCard icon={Send} label="Teslim Oranı" value={stats.delivery_rate != null ? `%${stats.delivery_rate}` : '—'} hint="bugün, gönderilenler içinde" />
        <StatCard icon={XCircle} label="Başarısız (bugün)" value={stats.failed_today ?? 0} hint={`Bounce: ${stats.bounced_today ?? 0}`} />
        <StatCard icon={AlertTriangle} label="Doğrulama / Reset Oranı" value={`%${stats.verification_rate ?? '—'} / %${stats.reset_rate ?? '—'}`} hint="bugün, gönderilenler içinde" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Email Merkezi</CardTitle>
          <CardDescription>
            Kayıt doğrulama, şifre sıfırlama ve sistem maillerinin teslim/doğrulama takibi.
            {' '}
            <span className="text-xs">
              "Açılma Oranı" (%{stats.open_rate ?? '—'}) Resend'de açık takibi etkinse ölçülür — hiç açılma yoksa bu, takibin kapalı olduğu anlamına da gelebilir.
              Resend'de "Rejected" diye ayrı bir olay yok; en yakın karşılıklar Bounce/Başarısız olarak gösteriliyor.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <EmailCenterFilters search={search} mailType={mailType} status={status} dateFrom={dateFrom} dateTo={dateTo} />
          <div className="rounded-md border border-border">
            <DataTable columns={columns} data={rows} emptyMessage="Aramanıza uygun mail kaydı bulunamadı." />
            <PaginationBar page={page} pageSize={PAGE_SIZE} totalCount={totalCount} buildHref={buildHref} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
