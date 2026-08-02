// "Görevli Müdür Yardımcısı" modülünün toplu üretim ucu — öğretmen
// motorunun (lib/db/bulkSchedule.js) PARALEL bir eşi, ona dokunmaz
// (bkz. lib/engine/assistantPrincipalRotation.js başındaki mimari notu).
// Kural motoru/adillik/fairness yok — sadece sıralı bir dönüşüm.
//
// Rotasyon durumu (kimin sırada olduğu) kalıcı bir cursor'da tutulmaz,
// öğretmen motoruyla aynı ilkeyle DB'deki son atamadan (çapa) yeniden
// kurulur: çapadan (dahil değil) hedef aralığın sonuna kadar TÜM
// işlenebilir (tatil/hafta sonu olmayan) günler "REPLAY" edilir, sonra
// sadece istenen [startDate, endDate] kısmı yazılır. Bu, aradaki
// boşlukların (uzun bir tatil bloğu gibi) rotasyonu YANLIŞ ilerletmesini
// engeller — tıpkı öğretmen motorunun "tatilde sıra dönmez" ilkesi gibi.
//
// KOTA (kalite denetimi kararı): ücretsiz plan öğretmen programıyla AYNI
// merkezi sayacı (subscriptions.free_generation_quota/used) kullanır —
// ayrı bir "AP kotası" YOK. Kontrol (requireCanGenerateSchedule) çağıran
// action'da (bkz. app/(wizard)/assistant-principal-schedule/actions.js);
// artırma (incrementFreeGenerationUsage) generateBulkSchedule ile AYNI
// noktada — bu fonksiyonun sonunda, başarılı her (dryRun olmayan) çağrıda.
// Süper admin/dev ortamı muafiyeti YENİ bir if ile değil, TEK merkezi
// noktadan (lib/db/subscriptions.js getSubscriptionForSchool → applyUnlimitedOverlay)
// otomatik geliyor — burada hiçbir admin/owner kontrolü tekrarlanmadı.

import { getAssistantPrincipals } from './assistantPrincipals';
import { getRotationSettings } from './assistantPrincipalRotationSettings';
import { getCalendarDays } from './calendarDays';
import {
  deleteAutoAssignmentsInRange,
  createAssignments,
  getLatestAssignmentBefore,
  countTrailingAssignmentsForPerson,
} from './assistantPrincipalAssignments';
import { requireUsableSubscription, incrementFreeGenerationUsage } from './subscriptions';
import { isPremium } from '@/lib/engine/access';
import { eachDateStr, isSchedulableDay } from '@/lib/engine/scheduler';
import { getWeekday } from '@/lib/engine/weekday';
import { addDays } from '@/lib/engine/rotation';
import { computeAssistantPrincipalAssignments } from '@/lib/engine/assistantPrincipalRotation';

export async function generateAssistantPrincipalSchedule(supabase, { schoolId, startDate, endDate, dryRun = false }) {
  const subscription = await requireUsableSubscription(supabase, schoolId);

  if (!dryRun) {
    await deleteAutoAssignmentsInRange(supabase, schoolId, startDate, endDate);
  }

  const allPeople = await getAssistantPrincipals(supabase, schoolId);
  const people = allPeople.filter((p) => p.is_active);
  const personIds = people.map((p) => p.id);

  let newAssignments = [];

  if (personIds.length) {
    const settings = await getRotationSettings(supabase, schoolId);
    const blockSize = Math.max(1, Math.floor(settings.blockSizeDays) || 1);

    const anchor = await getLatestAssignmentBefore(supabase, schoolId, startDate);
    const replayFrom = anchor ? addDays(anchor.duty_date, 1) : startDate;
    const calendarStart = replayFrom < startDate ? replayFrom : startDate;

    const calendarDays = await getCalendarDays(supabase, schoolId, calendarStart, endDate);
    const calendarByDate = Object.fromEntries(calendarDays.map((c) => [c.calendar_date, c]));
    const isSchedulable = (date) =>
      isSchedulableDay({ weekday: getWeekday(date), calendarDay: calendarByDate[date] });

    const replayDates = eachDateStr(calendarStart, endDate).filter(isSchedulable);

    let resumeIndex = 0;
    let resumeDayCount = 0;
    if (anchor) {
      const anchorPersonIndex = personIds.indexOf(anchor.assistant_principal_id);
      if (anchorPersonIndex !== -1) {
        if (settings.mode === 'sequential_daily') {
          resumeIndex = (anchorPersonIndex + 1) % personIds.length;
        } else {
          resumeIndex = anchorPersonIndex;
          if (settings.mode === 'n_day_block') {
            resumeDayCount = await countTrailingAssignmentsForPerson(
              supabase,
              schoolId,
              anchor.duty_date,
              anchor.assistant_principal_id,
              blockSize,
            );
          }
        }
      }
    }

    const replayAssignments = computeAssistantPrincipalAssignments({
      personIds,
      dates: replayDates,
      mode: settings.mode,
      blockSizeDays: settings.blockSizeDays,
      resume: { index: resumeIndex, dayCount: resumeDayCount },
    });

    newAssignments = replayAssignments.filter((a) => a.date >= startDate);
  }

  if (dryRun) {
    return { createdCount: newAssignments.length };
  }

  const created = await createAssignments(supabase, schoolId, newAssignments);

  // Bu fonksiyon her zaman kendi bağımsız "üretim işlemi"dir (kullanıcı
  // Program Oluştur ile bu modülü AYRI butonlardan tetikliyor, bkz. dosya
  // başı notu) — bu yüzden burada da ayrı bir kez artırılır.
  if (!isPremium(subscription)) {
    await incrementFreeGenerationUsage(supabase);
  }

  return { createdCount: created.length };
}
