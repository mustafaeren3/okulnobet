'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSchoolId } from '@/lib/db/schoolContext';
import { generateAssistantPrincipalSchedule } from '@/lib/db/assistantPrincipalSchedule';
import { requireCanGenerateSchedule } from '@/lib/db/subscriptions';
import {
  getAssignmentsForRange,
  createManualAssignment,
  deleteAssignment,
} from '@/lib/db/assistantPrincipalAssignments';
import { getAssistantPrincipals } from '@/lib/db/assistantPrincipals';

// Görevli Müdür Yardımcısı modülü öğretmen nöbetinden bağımsız çalışır —
// bu yüzden kendi üretim/görüntüleme action'ları var, mevcut
// app/(wizard)/schedule/actions.js'e KARIŞTIRILMADI (paralel modül).
// Kota kontrolü (requireCanGenerateSchedule) BİLEREK burada, motorun
// (generateAssistantPrincipalSchedule) içinde değil — app/(wizard)/
// schedule/actions.js runBulkSchedule ile birebir aynı mimari (motorun
// kendisi meşru şekilde birden fazla kez çağrılabilmeli, kısıt gerçek
// UI giriş noktasında uygulanır).

export async function runAssistantPrincipalSchedule(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    // Ücretsiz plan kotası öğretmen programıyla PAYLAŞILIYOR (kalite
    // denetimi kararı) — bu modül daha önce hiç kota kontrolü yapmıyordu,
    // ücretsiz bir okul sınırsız üretebiliyordu.
    await requireCanGenerateSchedule(supabase, schoolId);

    await generateAssistantPrincipalSchedule(supabase, { schoolId, startDate, endDate });
    const rows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
    revalidatePath('/dashboard');
    return { rows };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchAssistantPrincipalSchedule(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    const rows = await getAssignmentsForRange(supabase, schoolId, startDate, endDate);
    return { rows };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchAssistantPrincipalOptions() {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const people = await getAssistantPrincipals(supabase, schoolId);
    return { people: people.filter((p) => p.is_active) };
  } catch (e) {
    return { error: e.message };
  }
}

export async function addManualAssistantPrincipalAssignment({ personId, date }) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    const row = await createManualAssignment(supabase, schoolId, { personId, date });
    revalidatePath('/dashboard');
    return { row };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeAssistantPrincipalAssignment(assignmentId) {
  const supabase = createClient();
  try {
    await requireSchoolId(supabase);
    await deleteAssignment(supabase, assignmentId);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
