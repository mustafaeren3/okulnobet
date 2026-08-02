-- ═══════════════════════════════════════════════════════════════
-- block_size_days için makul üst sınır (kalite denetimi bulgusu)
-- ═══════════════════════════════════════════════════════════════
-- Önceden sadece istemci tarafında ">= 1 tam sayı" kontrolü vardı, üst
-- sınır yoktu. 90 gün (~bir dönem) makul bir üst sınır: bunun üzerinde
-- bir "blok" rotasyonun anlamını (birden fazla kişi arasında DÖNÜŞÜM)
-- kaybettirir. DB seviyesinde zorunlu kılınır — action katmanındaki
-- kontrol (app/(wizard)/assistant-principals/actions.js) sadece erken/
-- anlaşılır bir hata mesajı için, GERÇEK sınır burada.
-- DO bloğu: Postgres'te "ADD CONSTRAINT IF NOT EXISTS" desteklenmiyor,
-- projenin diğer migration'larındaki idempotency alışkanlığı (create
-- table/index if not exists, drop policy if exists) burada bu şekilde
-- korunuyor — migration ikinci kez çalıştırılırsa hata vermez.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'assistant_principal_rotation_settings_block_size_check'
  ) then
    alter table public.assistant_principal_rotation_settings
      add constraint assistant_principal_rotation_settings_block_size_check
      check (block_size_days is null or (block_size_days >= 1 and block_size_days <= 90));
  end if;
end $$;
