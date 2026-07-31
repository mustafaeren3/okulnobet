// enterprise_leads tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2). Girişsiz (anon) ziyaretçi de yazabilir — okuma yok,
// süper admin lib/db/platformAdmin.js üzerinden okur.

export async function createEnterpriseLead(supabase, { schoolName, contactName, phone, email, teacherCountEstimate, note }) {
  const { error } = await supabase.from('enterprise_leads').insert({
    school_name: schoolName,
    contact_name: contactName || null,
    phone: phone || null,
    email: email || null,
    teacher_count_estimate: teacherCountEstimate || null,
    note: note || null,
  });
  if (error) throw new Error(error.message);
}
