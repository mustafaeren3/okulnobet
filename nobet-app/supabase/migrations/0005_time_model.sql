-- ═══════════════════════════════════════════════════════════════
-- ZAMAN MODELİ: calendar_days + time_slots
-- ═══════════════════════════════════════════════════════════════
-- calendar_days: gün tipi (tatil / yarım gün / tören / sınav / normal).
-- Eski `holidays` tablosunun yerine geçmez (o hâlâ eski panelde
-- kullanılıyor); bu, yeni motorun okuduğu genelleştirilmiş halidir.
--
-- time_slots: bir okulun bir günü kaç zaman dilimine böldüğünü tanımlar.
-- İkili öğretim (sabahçı/öğlenci) tam olarak burada çözülür: ikili
-- öğretim yapan okulda 'morning' ve 'afternoon' iki ayrı slot olarak
-- tanımlanır, normal okulda tek 'full_day' slotu yeterlidir.

create table if not exists public.calendar_days (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  calendar_date date not null,
  day_type text not null check (day_type in ('holiday','half_day','ceremony','exam','normal')),
  description text,
  created_at timestamptz not null default now(),
  unique (school_id, calendar_date)
);

alter table public.calendar_days enable row level security;

drop policy if exists "calendar_days_all_own_school" on public.calendar_days;
create policy "calendar_days_all_own_school" on public.calendar_days
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.calendar_days to authenticated;

create table if not exists public.time_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  slot_key text not null check (slot_key in ('morning','afternoon','evening','full_day')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (school_id, slot_key)
);

alter table public.time_slots enable row level security;

drop policy if exists "time_slots_all_own_school" on public.time_slots;
create policy "time_slots_all_own_school" on public.time_slots
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.time_slots to authenticated;
