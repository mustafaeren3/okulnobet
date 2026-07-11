-- ═══════════════════════════════════════════════════════════════
-- RULE ENGINE + ROTATION ENGINE tabloları
-- ═══════════════════════════════════════════════════════════════
-- rules: kuralın kendisi veri, motor kodu değil. rule_key,
-- lib/engine/rules/ altındaki bir handler dosyasına karşılık gelir
-- (Faz 4). Yeni kural = yeni handler dosyası + burada yeni satır.
--
-- rotations: her öğretmenin rotasyon ilerleme durumu (cursor mantığı).
-- unique(teacher_id): bir öğretmenin okulda tek bir aktif rotasyon
-- durumu olur — rotation_mode değişse bile aynı satır güncellenir.

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  rule_key text not null,
  rule_type text not null check (rule_type in ('hard','soft')),
  params jsonb not null default '{}'::jsonb,
  weight int not null default 0,
  is_active boolean not null default true,
  description text,
  created_at timestamptz not null default now()
);

alter table public.rules enable row level security;

drop policy if exists "rules_all_own_school" on public.rules;
create policy "rules_all_own_school" on public.rules
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.rules to authenticated;

create table if not exists public.rotations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  rotation_mode text not null default 'haftalik_yer'
    check (rotation_mode in ('haftalik_yer','aylik_yer','haftalik_gun','sabit')),
  zone_cursor int not null default 0,
  day_cursor int not null default 0,
  cycle_count int not null default 0,
  last_advanced date,
  created_at timestamptz not null default now(),
  unique (teacher_id)
);

alter table public.rotations enable row level security;

drop policy if exists "rotations_all_own_school" on public.rotations;
create policy "rotations_all_own_school" on public.rotations
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.rotations to authenticated;
