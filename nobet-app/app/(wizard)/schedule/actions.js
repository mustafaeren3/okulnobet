'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSchoolId } from '@/lib/db/schoolContext';
import { generateBulkSchedule } from '@/lib/db/bulkSchedule';

export async function runBulkSchedule(startDate, endDate) {
  const supabase = createClient();
  try {
    const schoolId = await requireSchoolId(supabase);
    if (!startDate || !endDate) throw new Error('Başlangıç ve bitiş tarihi giriniz.');
    if (endDate < startDate) throw new Error('Bitiş tarihi başlangıçtan önce olamaz.');

    const result = await generateBulkSchedule(supabase, { schoolId, startDate, endDate });
    revalidatePath('/schedule');
    return result;
  } catch (e) {
    return { error: e.message };
  }
}
