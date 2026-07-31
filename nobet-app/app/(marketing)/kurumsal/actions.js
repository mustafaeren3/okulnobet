'use server';

import { createClient } from '@/lib/supabase/server';
import { createEnterpriseLead } from '@/lib/db/enterpriseLeads';

// Girişsiz (anon) ziyaretçi de çağırabilir — Kurumsal ("Teklif Al")
// formunun tek server action'ı. RLS: enterprise_leads insert herkese açık
// (bkz. 0018_leads.sql), okuma yok.
export async function submitEnterpriseLead(formData) {
  const supabase = createClient();
  try {
    const schoolName = (formData.schoolName || '').trim();
    if (!schoolName) throw new Error('Okul/kurum adı giriniz.');

    await createEnterpriseLead(supabase, {
      schoolName,
      contactName: (formData.contactName || '').trim(),
      phone: (formData.phone || '').trim(),
      email: (formData.email || '').trim(),
      teacherCountEstimate: formData.teacherCountEstimate ? parseInt(formData.teacherCountEstimate, 10) : null,
      note: (formData.note || '').trim(),
    });
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}
