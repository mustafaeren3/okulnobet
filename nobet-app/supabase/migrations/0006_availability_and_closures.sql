-- ═══════════════════════════════════════════════════════════════
-- teacher_unavailable_days + zone_closures
-- ═══════════════════════════════════════════════════════════════
-- teacher_unavailable_days: bir öğretmen için seçilmiş haftanın günlerini
-- tutar. Sadece weekday saklanır — anlamı tek başına bu tablodan
-- çıkarılamaz, teachers.restriction_mode ile birlikte okunur:
-- 'ALL'    → bu tablodaki satırlar yok sayılır (kısıt yok).
-- 'ONLY'   → buradaki günler öğretmenin çalıştığı TEK günlerdir.
-- 'EXCEPT' → buradaki günler öğretmenin çalışmadığı günlerdir.
-- (Faz 2'nin ilk sürümünde ayrıca bir 'shift' kolonu vardı — ikili
-- öğretimde sabah/öğleden sonra ayrımı için. MVP kapsamı dışına
-- alındı, ürün kararıyla tabloyu sadece weekday tutacak şekilde
-- basitleştirdik; ikili öğretim dilim bazlı kısıt gerekirse ayrı bir
-- migration'da eklenecek.)
--
-- zone_closures: bir bölgenin geçici olarak kapalı olduğu tarih aralığı
-- (tadilat, spor salonu arızası, kantin kapalı vb.).

create table if not exists public.teacher_unavailable_days (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  created_at timestamptz not null default now(),
  unique (teacher_id, weekday)
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
