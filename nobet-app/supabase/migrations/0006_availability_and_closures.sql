-- ═══════════════════════════════════════════════════════════════
-- teacher_unavailable_days + zone_closures
-- ═══════════════════════════════════════════════════════════════
-- teacher_unavailable_days: bir öğretmenin HANGİ haftanın günlerinde
-- (+ isteğe bağlı hangi zaman diliminde) okulda/nöbette olmadığını
-- tutar. Varsayım: kayıt yoksa öğretmen o gün müsaittir (satır sadece
-- istisnayı temsil eder — "available" tablosu değil "unavailable").
-- shift = 'all' → o gün tamamen müsait değil; 'morning'/'afternoon' →
-- ikili öğretimde sadece o dilimde müsait değil.
--
-- zone_closures: bir bölgenin geçici olarak kapalı olduğu tarih aralığı
-- (tadilat, spor salonu arızası, kantin kapalı vb.).

create table if not exists public.teacher_unavailable_days (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  shift text not null default 'all' check (shift in ('all','morning','afternoon')),
  created_at timestamptz not null default now(),
  unique (teacher_id, weekday, shift)
);

alter table public.teacher_unavailable_days enable row level security;

drop policy if exists "teacher_unavailable_days_all_own_school" on public.teacher_unavailable_days;
create policy "teacher_unavailable_days_all_own_school" on public.teacher_unavailable_days
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.teacher_unavailable_days to authenticated;

create table if not exists public.zone_closures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  zone_id uuid not null references public.duty_zones(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table public.zone_closures enable row level security;

drop policy if exists "zone_closures_all_own_school" on public.zone_closures;
create policy "zone_closures_all_own_school" on public.zone_closures
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.zone_closures to authenticated;
