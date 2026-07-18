// rules tablosuna dokunan sorgular. Component/action'lar Supabase'i
// doğrudan çağırmaz, bu katman üzerinden erişir (CLAUDE.md mimari kural 2).
//
// lib/engine/rules/'taki 6 hard rule dosyasının rule_key'leri (her
// dosyanın kendi döndürdüğü ruleKey ile birebir aynı olmalı).
export const HARD_RULE_KEYS = [
  'active_status',
  'zone_active_day',
  'branch_match',
  'teacher_availability',
  'zone_closure',
  'max_duty_per_day',
];

export const HARD_RULE_LABELS = {
  active_status: 'Pasif öğretmen veya bölgeye atama yapılmaz',
  zone_active_day: 'Bölge, çalışmadığı günlerde kullanılmaz',
  branch_match: 'Öğretmenin branşı bölgenin izinli/yasaklı branş listeleriyle eşleşmeli',
  teacher_availability: 'Öğretmenin gün kısıtına (Sadece seçili günler / Seçili günler hariç) uyulur',
  zone_closure: 'Kapalı olarak işaretlenen bölge tarih aralıklarında atama yapılmaz',
  max_duty_per_day: 'Bir öğretmen günde izin verilenden fazla nöbet tutamaz (çift nöbet ayarına göre)',
};

export async function getRules(supabase, schoolId) {
  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .eq('school_id', schoolId)
    .eq('rule_type', 'hard')
    .in('rule_key', HARD_RULE_KEYS);
  if (error) throw new Error(error.message);
  return data;
}

// Bir okulda hangi hard rule_key'lerin etkin olduğunu bir Set olarak
// döndürür. rules tablosunda satırı olmayan bir rule_key varsayılan
// olarak ETKİN sayılır — böylece rules tablosunda hiç yapılandırması
// olmayan okullarda (bugüne kadarki tüm okullar) davranış değişmez.
export async function getActiveHardRuleKeys(supabase, schoolId) {
  const rows = await getRules(supabase, schoolId);
  const overrideByKey = Object.fromEntries(rows.map((r) => [r.rule_key, r.is_active]));
  return new Set(HARD_RULE_KEYS.filter((key) => overrideByKey[key] !== false));
}

// Bir hard rule'u okul bazında açar/kapatır. rules tablosunda
// (school_id, rule_key) için doğal bir unique kısıt yok — bu yüzden
// önce var olan satırı arayıp güncelliyoruz, yoksa yeni satır ekliyoruz.
export async function setHardRuleActive(supabase, schoolId, ruleKey, isActive) {
  const { data: existing, error: fetchError } = await supabase
    .from('rules')
    .select('id')
    .eq('school_id', schoolId)
    .eq('rule_key', ruleKey)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);

  if (existing) {
    const { error } = await supabase.from('rules').update({ is_active: isActive }).eq('id', existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from('rules')
    .insert({ school_id: schoolId, rule_key: ruleKey, rule_type: 'hard', is_active: isActive });
  if (error) throw new Error(error.message);
}
