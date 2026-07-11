-- ═══════════════════════════════════════════════════════════════
-- TEACHERS + DUTY_ZONES (yeni kural/zamanlama motorunun temel tabloları)
-- ═══════════════════════════════════════════════════════════════
-- NOT: Bu iki tablo, eski dashboard'un kullandığı `staff` / `locations`
-- tablolarının YERİNE geçmez — onlar hâlâ eski panelde canlı ve
-- dokunulmuyor (bkz. PHASE_REPORT.md Faz 1). `teachers` / `duty_zones`,
-- CLAUDE.md'deki ortak dile uygun, yeni Rule Engine ve Scheduling
-- Engine'in (Faz 4-5) okuyacağı kanonik tablolardır. Eski panel Faz 3'te
-- yeni sihirbaz tabanlı panelle değiştirildiğinde `staff`/`locations`
-- kaldırılacak.

-- ── teachers ──────────────────────────────────────────────────────
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  full_name text not null,
  branch text not null,
  weekly_capacity int not null default 1,
  is_active boolean not null default true,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.teachers enable row level security;

drop policy if exists "teachers_all_own_school" on public.teachers;
create policy "teachers_all_own_school" on public.teachers
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.teachers to authenticated;

-- ── duty_zones ────────────────────────────────────────────────────
create table if not exists public.duty_zones (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  required_count int not null default 1,
  active_days int[] not null default '{1,2,3,4,5}',
  allowed_branches text[],
  blocked_branches text[],
  priority int not null default 0,
  is_active boolean not null default true,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.duty_zones enable row level security;

drop policy if exists "duty_zones_all_own_school" on public.duty_zones;
create policy "duty_zones_all_own_school" on public.duty_zones
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.duty_zones to authenticated;
