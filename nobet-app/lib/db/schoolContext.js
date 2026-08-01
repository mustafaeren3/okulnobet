// Oturum sahibi kullanıcının bağlı olduğu okulu çözer (school_users +
// schools join). Component/page ve server action'lar okul bağlamına
// buradan ulaşır, doğrudan Supabase sorgusu yazmaz (CLAUDE.md mimari
// kural 2 — bu kural server action'lar için de geçerli, sadece
// component/page değil).
import { getActiveImpersonation } from './impersonation';

export async function getSchoolForUser(supabase, userId) {
  // .single() değil .maybeSingle(): kullanıcının school_users satırı
  // yoksa (okul silinmiş / kayıt yarım kalmış) hata fırlatmak yerine
  // null döner — sayfalar "Henüz bir okula bağlı değilsin" gösterir,
  // çökmez.
  const { data, error } = await supabase
    .from('school_users')
    .select('school_id, schools(name, profile)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    return {
      schoolId: data.school_id,
      schoolName: data.schools?.name,
      principalName: data.schools?.profile?.principal_name || '',
      assistantPrincipalName: data.schools?.profile?.assistant_principal_name || '',
      isImpersonating: false,
    };
  }

  // school_users'ta satırı yok — normal bir kullanıcı için bu "okula
  // bağlı değil" demektir. Ama platform_admin AKTİF bir impersonation
  // başlattıysa (bkz. lib/db/impersonation.js, migration 0035) hedef
  // okulu döner — current_school_id() DB tarafında zaten AYNI kararı
  // veriyor (RLS bunu bağımsızca doğruluyor, burası sadece dashboard'un
  // HANGİ okulu göstereceğini/adını bilmesi için).
  const impersonation = await getActiveImpersonation(supabase).catch(() => null);
  if (!impersonation) return null;

  const { data: schoolRow, error: schoolError } = await supabase
    .from('schools')
    .select('name, profile')
    .eq('id', impersonation.target_school_id)
    .maybeSingle();
  if (schoolError) throw new Error(schoolError.message);

  return {
    schoolId: impersonation.target_school_id,
    schoolName: schoolRow?.name,
    principalName: schoolRow?.profile?.principal_name || '',
    assistantPrincipalName: schoolRow?.profile?.assistant_principal_name || '',
    isImpersonating: true,
    impersonatedOwnerEmail: impersonation.owner_email,
    impersonatedOwnerFullName: impersonation.owner_full_name,
  };
}

// Okul müdürü / müdür yardımcısı adı — 0003_school_profile.sql'deki esnek
// `profile` jsonb sütununda tutuluyor (bu alan tam olarak "sık değişmeyen,
// şablon seçimini etkilemeyen ek bilgi" için tasarlanmıştı — yeni bir
// migration/sütun gerekmiyor). Resmi nöbet çizelgesi çıktısında imza
// bloğuna otomatik yazılır. Tek fonksiyon, hangi profil alanı(ları)
// güncelleneceğini bir patch objesiyle alır (principal_name ve
// assistant_principal_name — iki somut kullanım olduğu için genel
// tutuldu, üçüncü bir alan gelirse aynı şekilde eklenir).
export async function updateSchoolProfileFields(supabase, schoolId, patch) {
  const { data, error: fetchError } = await supabase
    .from('schools')
    .select('profile')
    .eq('id', schoolId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const profile = { ...(data.profile || {}), ...patch };
  const { error } = await supabase.from('schools').update({ profile }).eq('id', schoolId);
  if (error) throw new Error(error.message);
}

export async function requireSchoolId(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapılmamış.');
  const school = await getSchoolForUser(supabase, user.id);
  if (!school) throw new Error('Kullanıcı bir okula bağlı değil.');
  return school.schoolId;
}

// Okulun nöbet dönme düzeni (bkz. 0011_school_rotation_mode.sql).
// Sütun default'u 'haftalik_yer' — eski okullar da bu değeri alır.
export async function getSchoolRotationMode(supabase, schoolId) {
  const { data, error } = await supabase
    .from('schools')
    .select('rotation_mode')
    .eq('id', schoolId)
    .single();
  if (error) throw new Error(error.message);
  return data.rotation_mode;
}

export async function setSchoolRotationMode(supabase, schoolId, mode) {
  const { error } = await supabase
    .from('schools')
    .update({ rotation_mode: mode })
    .eq('id', schoolId);
  if (error) throw new Error(error.message);
}
