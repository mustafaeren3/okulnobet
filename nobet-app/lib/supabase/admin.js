import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SADECE sunucu-only, kullanıcı oturumu OLMAYAN bağlamlar için (ör. Resend
// webhook route'u — dış servisten gelen bir HTTP isteği, Supabase cookie/
// session'ı yok). RLS'i TAMAMEN bypass eder — client component'e/normal
// server action'a ASLA import edilmemeli, sadece webhook/cron gibi
// güvenilir sunucu-sunucu uçlarında. Normal kod lib/supabase/server.js
// kullanmaya devam eder (CLAUDE.md mimari kural 2 ihlali değil — bu da
// "lib/db" katmanının bir parçası, sadece farklı bir client).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tanımlı değil.');
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
