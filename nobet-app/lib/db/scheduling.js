// Scheduling Engine'in "seç ve kaydet" ucu. lib/db/eligibility.js sadece
// okur/hesaplar (kimler uygun, kimi seçelim); bu dosya seçilen kararı
// duty_assignments'a yazar — okuma ve yazma sorumlulukları ayrı tutuluyor.

import { selectTeachersForZone } from './eligibility';
import { createAssignments } from './dutyAssignments';
import { requireUsableSubscription } from './subscriptions';

// Bir bölge+tarih için uygun adaylar arasından zone.required_count kadar
// öğretmen seçip her biri için bir duty_assignments satırı oluşturur.
// Zaten dolu required_count'a (o tarihte o bölgeye yeterince atama
// varsa) veya hiç uygun aday yoksa boş dizi döner, hata fırlatmaz.
export async function assignTeachersToZone(supabase, { schoolId, zoneId, date }) {
  await requireUsableSubscription(supabase, schoolId);

  const selected = await selectTeachersForZone(supabase, { schoolId, zoneId, date });
  if (!selected.length) return [];

  return createAssignments(
    supabase,
    schoolId,
    selected.map((c) => ({ teacherId: c.teacher.id, zoneId, date }))
  );
}
