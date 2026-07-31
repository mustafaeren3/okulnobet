import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getPlatformSchools, getPlatformPayments, getGenerationSuccessRate } from '@/lib/db/platformAdmin';
import { getPlatformSystemEvents } from '@/lib/db/systemEvents';
import { computePlatformMetrics } from '@/lib/engine/platformMetrics';
import OverviewClient from './OverviewClient';

// Genel Bakış — GERÇEK verilerden hesaplanan metrikler (bkz.
// lib/engine/platformMetrics.js). "Toplam Tahsilat" artık payments
// tablosundan (Faz E), "Program Üretme Başarı Oranı"
// schedule_generations'tan (Faz F), "Son Kritik Sistem Olayları"
// system_events'ten (Faz F) — HİÇBİRİ uydurma değil.
export default async function OverviewPage() {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);

  const [schools, payments, successRate, systemEvents] = await Promise.all([
    getPlatformSchools(supabase),
    getPlatformPayments(supabase, { limit: 500 }),
    getGenerationSuccessRate(supabase),
    getPlatformSystemEvents(supabase, 20),
  ]);

  const metrics = computePlatformMetrics(schools);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const criticalEvents = systemEvents.filter((e) => e.event_type.endsWith('_rate_limited')).slice(0, 5);

  return (
    <OverviewClient
      schools={schools}
      metrics={metrics}
      totalCollected={totalCollected}
      successRate={successRate}
      criticalEvents={criticalEvents}
    />
  );
}
