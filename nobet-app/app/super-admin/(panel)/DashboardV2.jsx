'use client';

import {
  Users, UserPlus, CalendarPlus, CalendarRange, School, ClipboardList,
  ClipboardCheck, CreditCard, Gift, AlertTriangle, GraduationCap, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { StatCard } from '../ui/stat-card';

const CHART_COLORS = ['#4f7cff', '#16c784', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f472b6', '#84cc16'];

function formatDay(d) {
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}
function formatMonth(m) {
  const [, mo] = m.split('-');
  return ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][Number(mo) - 1];
}

// Süper admin dashboard v2 — Bölüm 1'de istenen kartlar + grafikler.
// stats, platform_dashboard_stats() RPC'sinin (bkz. migration 0031)
// tek jsonb dönüşü — istemci ayrı ayrı sorgu atmıyor.
export default function DashboardV2({ stats, successRate }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard icon={Users} label="Toplam Kullanıcı" value={stats.total_users} />
        <StatCard icon={UserPlus} label="Bugün Kayıt" value={stats.signups_today} />
        <StatCard icon={CalendarPlus} label="Son 7 Gün Kayıt" value={stats.signups_last_7_days} />
        <StatCard icon={CalendarRange} label="Son 30 Gün Kayıt" value={stats.signups_last_30_days} />
        <StatCard icon={School} label="Aktif Okul" value={stats.active_schools} hint={`/ ${stats.total_schools} toplam`} />
        <StatCard icon={GraduationCap} label="Toplam Öğretmen" value={stats.total_teachers} />
        <StatCard icon={ClipboardList} label="Toplam Nöbet" value={stats.total_duty_assignments} />
        <StatCard icon={ClipboardCheck} label="Bugünkü Nöbet" value={stats.duty_assignments_today} />
        <StatCard icon={CreditCard} label="Aktif Abonelik" value={stats.active_subscriptions} hint="standard + enterprise" />
        <StatCard icon={Gift} label="Ücretsiz Plan" value={stats.free_plan_count} />
        <StatCard icon={AlertTriangle} label="Süresi Dolan / Donuk" value={stats.expired_or_frozen_count} />
        <StatCard icon={Activity} label="Sistem Durumu" value={successRate !== null ? `%${successRate}` : '—'} hint="üretim başarı oranı" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Günlük Üye Kaydı</CardTitle>
            <CardDescription>Son 30 gün</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.daily_signups}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tickFormatter={formatDay} stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip labelFormatter={formatDay} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} name="Kayıt" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Haftalık Büyüme</CardTitle>
            <CardDescription>Son 12 hafta</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weekly_signups}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week_start" tickFormatter={formatDay} stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip labelFormatter={formatDay} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Kayıt" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aylık Büyüme</CardTitle>
            <CardDescription>Son 12 ay</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly_signups}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month_start" tickFormatter={formatMonth} stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip labelFormatter={formatMonth} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Kayıt" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Okul Türlerine Göre Dağılım</CardTitle>
            <CardDescription>{stats.school_type_distribution.length === 0 ? 'Henüz veri yok' : `${stats.total_schools} okul`}</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {stats.school_type_distribution.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Henüz veri yok</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.school_type_distribution} dataKey="count" nameKey="school_type" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {stats.school_type_distribution.map((entry, i) => (
                      <Cell key={entry.school_type} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İl Bazında Kullanıcı Yoğunluğu</CardTitle>
          <CardDescription>En çok okulu olan ilk 15 il</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {stats.city_distribution.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Henüz veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.city_distribution} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="city" stroke="var(--text-muted)" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} name="Okul" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
