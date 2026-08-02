// assistant_principal_rotation_settings tablosuna dokunan sorgular
// (bkz. supabase/migrations/0038). Tek bir okulun tek bir role_key'i
// için satır — bugün role_key her zaman 'assistant_principal'.

const ROLE_KEY = 'assistant_principal';

const DEFAULT_SETTINGS = { mode: 'sequential_daily', blockSizeDays: null };

export async function getRotationSettings(supabase, schoolId) {
  const { data, error } = await supabase
    .from('assistant_principal_rotation_settings')
    .select('mode, block_size_days')
    .eq('school_id', schoolId)
    .eq('role_key', ROLE_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return DEFAULT_SETTINGS;
  return { mode: data.mode, blockSizeDays: data.block_size_days };
}

export async function setRotationSettings(supabase, schoolId, { mode, blockSizeDays }) {
  const { error } = await supabase.from('assistant_principal_rotation_settings').upsert(
    {
      school_id: schoolId,
      role_key: ROLE_KEY,
      mode,
      block_size_days: blockSizeDays ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'school_id,role_key' },
  );
  if (error) throw new Error(error.message);
}
