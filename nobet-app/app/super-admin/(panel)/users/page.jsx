import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformSchoolsPage } from '@/lib/db/platformAdmin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { DataTable } from '../../ui/data-table';
import { PaginationBar } from '../../ui/pagination';
import UserFilters from './UserFilters';

const STATUS_VARIANT = { active: 'success', past_due: 'warning', expired: 'destructive', cancelled: 'outline', frozen: 'destructive' };
const STATUS_LABEL = { active: 'Aktif', past_due: 'Ödeme Gecikti', expired: 'Süresi Doldu', cancelled: 'İptal', frozen: 'Dondurulmuş' };
const PLAN_LABEL = { free: 'Ücretsiz', standard: 'Standart', enterprise: 'Kurumsal' };
const QUICK_LABEL = {
  today_signup: 'Bugün kayıt olanlar', week_signup: 'Bu hafta kayıt olanlar', month_signup: 'Bu ay kayıt olanlar',
  trial: 'Trial kullanıcılar', premium: 'Premium kullanıcılar', recent_login: 'Son giriş yapanlar',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('tr-TR');
}
function formatDateTime(d) {
  if (!d) return 'Hiç giriş yapmadı';
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 25;

// Server Component — veri BURADA, sunucuda çekiliyor (RSC), istemciye
// sadece hazır HTML gidiyor. Arama/filtre/sayfalama URL searchParams
// üzerinden (bkz. UserFilters.jsx + PaginationBar) — client tarafında
// ayrı bir "kullanıcı listesi" state'i YOK, tek doğruluk kaynağı URL.
//
// "Kullanıcı" burada okul sahibi demek — bu üründe her okulun TEK
// sahibi var (school_users, register_school her zaman 1 satır ekliyor).
// Ayrı bir "users" tablosu/RPC'si YOK — mevcut platform_list_schools_page
// auth.users ile LATERAL join edilerek genişletildi (bkz. migration 0032).
export default async function UsersPage({ searchParams }) {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);

  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.search || null;
  const plan = searchParams.plan && searchParams.plan !== 'all' ? searchParams.plan : null;
  const status = searchParams.status && searchParams.status !== 'all' ? searchParams.status : null;
  const quick = searchParams.quick || null;
  const sort = quick === 'recent_login' ? 'last_login_desc' : 'created_at_desc';

  const rows = await getPlatformSchoolsPage(supabase, { search, plan, status, quickFilter: quick, sort, page, pageSize: PAGE_SIZE });
  const totalCount = rows[0]?.total_count ? Number(rows[0].total_count) : 0;

  function buildHref(targetPage) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (plan) params.set('plan', plan);
    if (status) params.set('status', status);
    if (quick) params.set('quick', quick);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return qs ? `/super-admin/users?${qs}` : '/super-admin/users';
  }

  const columns = [
    {
      key: 'name', header: 'Ad Soyad / Mail',
      cell: (r) => (
        <Link href={`/super-admin/users/${r.school_id}`} className="block hover:underline">
          <div className="font-medium">{r.full_name || '—'}</div>
          <div className="text-xs text-muted-foreground">{r.email || '—'}</div>
        </Link>
      ),
    },
    { key: 'school', header: 'Okul', cell: (r) => r.school_name },
    { key: 'location', header: 'İl / İlçe', cell: (r) => <span className="text-muted-foreground">{r.district} / {r.city}</span> },
    { key: 'created_at', header: 'Kayıt Tarihi', cell: (r) => formatDate(r.created_at) },
    { key: 'last_sign_in_at', header: 'Son Giriş', cell: (r) => <span className="text-xs">{formatDateTime(r.last_sign_in_at)}</span> },
    {
      key: 'plan', header: 'Abonelik',
      cell: (r) => (
        <div className="flex flex-col gap-1">
          <Badge variant={r.plan_type === 'free' ? 'secondary' : 'default'}>{PLAN_LABEL[r.plan_type] || r.plan_type || '—'}</Badge>
          {r.plan_type === 'free' && <span className="text-xs text-muted-foreground">Trial · {r.free_generation_used ?? 0}/{r.free_generation_quota ?? '—'} kullanım</span>}
        </div>
      ),
    },
    {
      key: 'status', header: 'Durum',
      cell: (r) => <Badge variant={STATUS_VARIANT[r.subscription_status] || 'outline'}>{STATUS_LABEL[r.subscription_status] || r.subscription_status || '—'}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Kullanıcılar</CardTitle>
          <CardDescription>
            {quick ? (
              <span className="inline-flex items-center gap-2">
                Filtre: <Badge variant="secondary">{QUICK_LABEL[quick] || quick}</Badge>
                <Link href="/super-admin/users" className="text-primary hover:underline">temizle</Link>
              </span>
            ) : (
              'Her okulun sahibi tek bir kullanıcı — okul ve kullanıcı bilgisi birlikte gösteriliyor.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <UserFilters search={search} plan={plan} status={status} quick={quick} />
          <div className="rounded-md border border-border">
            <DataTable columns={columns} data={rows} emptyMessage="Aramanıza uygun kullanıcı bulunamadı." />
            <PaginationBar page={page} pageSize={PAGE_SIZE} totalCount={totalCount} buildHref={buildHref} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
