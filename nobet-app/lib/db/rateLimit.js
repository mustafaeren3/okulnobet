// rate_limit_events / check_rate_limit RPC'sine dokunan sorgular (bkz.
// supabase/migrations/0026_rate_limiting_and_events.sql). Component/
// action'lar Supabase'i doğrudan çağırmaz (CLAUDE.md mimari kural 2).

// true = izinli, false = limit aşıldı (çağıran engellemeli).
export async function checkRateLimit(supabase, key, maxAttempts, windowSeconds) {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(error.message);
  return data === true;
}
