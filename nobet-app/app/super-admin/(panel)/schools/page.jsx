'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { School } from 'lucide-react';
import { fetchSchoolsPage } from '../../actions/schools';
import Badge from '../../../components/Badge';
import Pagination from '../../../components/Pagination';
import '../../../(wizard)/dashboard/dashboard.css';

const STATUS_LABELS = { active: 'Aktif', past_due: 'Ödeme Gecikti', expired: 'Süresi Doldu', cancelled: 'İptal Edildi', frozen: 'Dondurulmuş' };
const STATUS_VARIANTS = { active: 'success', past_due: 'warning', expired: 'danger', cancelled: 'neutral', frozen: 'danger' };
const PLAN_LABELS = { free: 'Ücretsiz', standard: 'Standart', enterprise: 'Kurumsal' };
const PAGE_SIZE = 25;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Sunucu taraflı arama/filtre/sıralama/sayfalama — bkz.
// supabase/migrations/0023_schools_pagination.sql platform_list_schools_page.
// Tüm okullar TEK seferde tarayıcıya gönderilmiyor (D2 bulgusunun düzeltmesi).
export default function SchoolsListPage() {
  const [filters, setFilters] = useState({ search: '', city: '', district: '', plan: '', status: '', sort: 'created_at_desc', page: 1 });
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await fetchSchoolsPage({ ...filters, pageSize: PAGE_SIZE });
      if (cancelled) return;
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      setError('');
      setRows(res.rows);
      setTotalCount(res.totalCount);
    }, 300); // arama alanı için basit debounce
    return () => { cancelled = true; clearTimeout(t); };
  }, [filters]);

  function updateFilter(patch) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="dash-root" style={{ minHeight: 'auto' }}>
      <div className="card">
        <h3><School size={17} /> Okullar</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <input placeholder="Okul adı ara..." value={filters.search} onChange={(e) => updateFilter({ search: e.target.value })} style={{ flex: '1 1 200px' }} />
          <input placeholder="İl" value={filters.city} onChange={(e) => updateFilter({ city: e.target.value })} style={{ width: 120 }} />
          <input placeholder="İlçe" value={filters.district} onChange={(e) => updateFilter({ district: e.target.value })} style={{ width: 120 }} />
          <select value={filters.plan} onChange={(e) => updateFilter({ plan: e.target.value })}>
            <option value="">Tüm Planlar</option>
            {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => updateFilter({ status: e.target.value })}>
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filters.sort} onChange={(e) => updateFilter({ sort: e.target.value })}>
            <option value="created_at_desc">Kayıt: Yeni → Eski</option>
            <option value="created_at_asc">Kayıt: Eski → Yeni</option>
            <option value="name_asc">Ad: A → Z</option>
            <option value="name_desc">Ad: Z → A</option>
            <option value="teacher_count_desc">Öğretmen Sayısı: Çok → Az</option>
          </select>
        </div>

        {error && <div className="holiday-tag" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="schedule-wrapper" style={{ overflowX: 'auto' }}>
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Okul</th><th>Plan</th><th>Durum</th><th>Öğretmen</th><th>Son Aktiflik</th><th>Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Yükleniyor...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Sonuç bulunamadı.</td></tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.school_id}>
                    <td style={{ textAlign: 'left' }}>
                      <Link href={`/super-admin/schools/${s.school_id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{s.school_name}</Link>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.city} / {s.district}</div>
                    </td>
                    <td>{PLAN_LABELS[s.plan_type] || s.plan_type || '—'}</td>
                    <td>
                      {s.subscription_status ? (
                        <Badge variant={STATUS_VARIANTS[s.subscription_status] || 'neutral'}>
                          {STATUS_LABELS[s.subscription_status] || s.subscription_status}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td>{s.teacher_count}</td>
                    <td>{s.last_generated_at ? formatDate(s.last_generated_at) : '—'}</td>
                    <td>{formatDate(s.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={filters.page}
          totalPages={totalPages}
          totalCount={totalCount}
          itemLabel="okul"
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        />
      </div>
    </div>
  );
}
