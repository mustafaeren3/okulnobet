import { describe, it, expect } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { getSubscriptionForSchool } from '@/lib/db/subscriptions';

const RUN_ID = Date.now();

describe('lib/db/subscriptions — register_school kalıcı ücretsiz plan başlatır', () => {
  it('yeni okul kaydı otomatik olarak free/active durumunda bir subscriptions satırı alır (Admin v2: eski trial isimleri kaldırıldı)', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('subscription', RUN_ID));

    const subscription = await getSubscriptionForSchool(client, schoolId);

    expect(subscription).not.toBeNull();
    expect(subscription.plan_type).toBe('free');
    expect(subscription.status).toBe('active');
    expect(subscription.current_period_end).toBeNull();
    expect(subscription.free_generation_quota).toBe(1);
    expect(subscription.free_generation_used).toBe(0);
  }, 30000);

  it('başka bir okulun subscriptions satırını okuyamaz (RLS)', async () => {
    const clientA = newClient();
    const clientB = newClient();
    const schoolIdB = await signUpAndRegisterSchool(clientB, makeTestUser('subscription-b', RUN_ID));
    await signUpAndRegisterSchool(clientA, makeTestUser('subscription-a', RUN_ID));

    const { data, error } = await clientA.from('subscriptions').select('*').eq('school_id', schoolIdB);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  }, 30000);
});
