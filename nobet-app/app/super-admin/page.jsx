import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin, getPlatformSchools } from '@/lib/db/platformAdmin';
import SuperAdminPanel from './SuperAdminPanel';

// Platform sahibinin TÜM okulları gördüğü/yönettiği panel — normal okul
// hesaplarından (school_users) tamamen ayrı bir yetki: platform_admins
// tablosunda satırı olan kullanıcı erişebilir (bkz.
// supabase/migrations/0016_super_admin.sql). Okula bağlı olmak ya da
// olmamak bu sayfa için önemsiz, sadece platform_admins üyeliği sayılır.

export default async function SuperAdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // isPlatformAdmin RPC henüz yoksa (migration uygulanmadan) veya başka
  // bir DB hatası olursa çökmek yerine "admin değil" say — bu sayfa
  // dışarıdan asla veri sızdırmamalı, hataya karşı en güvenli varsayılan
  // erişimi REDDETMEK.
  let isAdmin = false;
  try {
    isAdmin = await isPlatformAdmin(supabase);
  } catch {
    isAdmin = false;
  }
  if (!isAdmin) redirect('/dashboard');

  const schools = await getPlatformSchools(supabase);

  return <SuperAdminPanel initialSchools={schools} />;
}
