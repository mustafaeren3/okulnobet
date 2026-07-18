import { describe, it, expect } from 'vitest';
import { newClient, makeTestUser, signUpAndRegisterSchool } from './helpers';
import { getSubscriptionForSchool } from '@/lib/db/subscriptions';

const RUN_ID = Date.now();

describe('lib/db/subscriptions — register_school 14 günlük deneme başlatır', () => {
  it('yeni okul kaydı otomatik olarak trialing durumunda bir subscriptions satırı alır', async () => {
    const client = newClient();
    const schoolId = await signUpAndRegisterSchool(client, makeTestUser('subscription', RUN_ID));

    const subscription = await getSubscriptionForSchool(client, schoolId);

    expect(subscription).not.toBeNull();
    expect(subscription.plan_type).toBe('trial');
    expect(subscription.status).toBe('trialing');
    expect(subscription.trial_ends_at).not.toBeNull();
    expect(subscription.current_period_end).toBeNull();

    // trial_ends_at ~14 gün sonrası olmalı (birkaç saniyelik sapma toleranslı).
    const daysUntilTrialEnd = (new Date(subscription.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24);
    expect(daysUntilTrialEnd).toBeGreaterThan(13.9);
    expect(daysUntilTrialEnd).toBeLessThan(14.1);
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
