-- ═══════════════════════════════════════════════════════════════
-- ASSISTANT_PRINCIPAL_ROTATION_SETTINGS (dönüşüm tipi + parametreleri)
-- ═══════════════════════════════════════════════════════════════
-- Bir okulun bu modülü nasıl çalıştıracağını tutar: hangi dönüşüm
-- modu (her gün sırayla / haftalık / N günlük blok) ve blok modunda
-- kaç gün. `role_key` bugün her zaman 'assistant_principal' ama
-- ileride ikinci bir dönen-rol (örn. "Nöbetçi İdareci") çıkarsa aynı
-- tabloya yeni bir satır (school_id, role_key) eklenerek genişler —
-- bunun için şimdiden genel bir "N-rol motoru" kurulmuyor (YAGNI),
-- sadece satır şekli buna kapalı kalmıyor.

create table if not exists public.assistant_principal_rotation_settings (
  school_id uuid not null references public.schools(id) on delete cascade,
  role_key text not null default 'assistant_principal',
  mode text not null default 'sequential_daily'
    check (mode in ('sequential_daily', 'weekly_block', 'n_day_block')),
  block_size_days int,
  updated_at timestamptz not null default now(),
  primary key (school_id, role_key)
);

alter table public.assistant_principal_rotation_settings enable row level security;

drop policy if exists "ap_rotation_settings_all_own_school" on public.assistant_principal_rotation_settings;
create policy "ap_rotation_settings_all_own_school" on public.assistant_principal_rotation_settings
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.assistant_principal_rotation_settings to authenticated;
