// purchase_intents tablosuna dokunan sorgular. Component/action'lar
// Supabase'i doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md
// mimari kural 2).

export async function createPurchaseIntent(supabase, schoolId, { contactName, contactPhone, note } = {}) {
  const { error } = await supabase.from('purchase_intents').insert({
    school_id: schoolId,
    contact_name: contactName || null,
    contact_phone: contactPhone || null,
    note: note || null,
  });
  if (error) throw new Error(error.message);
}
