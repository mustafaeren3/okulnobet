import { describe, it, expect } from 'vitest';
import { newClient } from './helpers';

const RUN_ID = Date.now();

// check_rate_limit() admin/MFA/giriş GEREKTİRMİYOR (authenticated + anon'a
// açık, bkz. 0026_rate_limiting_and_events.sql — login denemesi gibi
// oturum açılmadan ÖNCE de çalışması gerekiyor) — girişsiz (anon) bir
// istemciyle tam olarak test edilebilir.
describe('check_rate_limit RPC', () => {
  it('sınır aşılana kadar true, aşılınca false döner (geçer + eler)', async () => {
    const client = newClient();
    const key = `test-key-${RUN_ID}-${Math.random()}`;

    for (let i = 0; i < 3; i++) {
      const { data, error } = await client.rpc('check_rate_limit', { p_key: key, p_max_attempts: 3, p_window_seconds: 60 });
      expect(error).toBeNull();
      expect(data).toBe(true);
    }

    const { data: blocked, error } = await client.rpc('check_rate_limit', { p_key: key, p_max_attempts: 3, p_window_seconds: 60 });
    expect(error).toBeNull();
    expect(blocked).toBe(false);
  }, 30000);

  it('farklı anahtarlar birbirini etkilemez (geçer)', async () => {
    const client = newClient();
    const keyA = `test-key-a-${RUN_ID}-${Math.random()}`;
    const keyB = `test-key-b-${RUN_ID}-${Math.random()}`;

    for (let i = 0; i < 5; i++) {
      await client.rpc('check_rate_limit', { p_key: keyA, p_max_attempts: 2, p_window_seconds: 60 });
    }
    const { data } = await client.rpc('check_rate_limit', { p_key: keyB, p_max_attempts: 2, p_window_seconds: 60 });
    expect(data).toBe(true);
  }, 30000);
});
