-- ═══════════════════════════════════════════════════════════════
-- DASHBOARD ŞEMASI (register_school + personel/lokasyon/tatil tabloları)
-- ═══════════════════════════════════════════════════════════════
-- Bu dosyayı Supabase SQL Editor'de çalıştır. Var olan tabloları
-- yeniden oluşturmaz, güvenle tekrar tekrar çalıştırılabilir.

-- ── 1) register_school fonksiyonu (henüz çalıştırılmadıysa) ──────
create or replace function public.register_school(
  p_name text,
  p_city text,
  p_district text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_school_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapılmamış kullanıcı okul oluşturamaz';
  end if;

  if exists (select 1 from school_users where user_id = auth.uid()) then
    raise exception 'Bu kullanıcı zaten bir okula bağlı';
  end if;

  insert into schools (name, city, district)
  values (p_name, p_city, p_district)
  returning id into new_school_id;

  insert into school_users (user_id, school_id, role)
  values (auth.uid(), new_school_id, 'admin');

  insert into settings (school_id, start_date, end_date)
  values (new_school_id, '2026-09-14', '2027-06-25');

  return new_school_id;
end;
$$;

grant execute on function public.register_school(text, text, text) to authenticated;

-- ── 2) settings tablosuna ek sütunlar ────────────────────────────
alter table public.settings add column if not exists active_days int[] not null default '{1,2,3,4,5}';
alter table public.settings add column if not exists dist_method text not null default 'balanced';
alter table public.settings add column if not exists dist_same_loc text not null default 'avoid';
alter table public.settings add column if not exists teskilat_url text;

grant select, update on public.settings to authenticated;
grant select on public.school_users to authenticated;
grant select on public.schools to authenticated;

drop policy if exists "settings_select_own_school" on public.settings;
create policy "settings_select_own_school" on public.settings
  for select using (school_id = public.current_school_id());

drop policy if exists "settings_update_own_school" on public.settings;
create policy "settings_update_own_school" on public.settings
  for update using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- ── 3) staff (personel) ──────────────────────────────────────────
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  num int not null default 1,
  restrict_code text,
  color text not null default '4472C4',
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

drop policy if exists "staff_all_own_school" on public.staff;
create policy "staff_all_own_school" on public.staff
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.staff to authenticated;

alter table public.staff add column if not exists allow_double_duty boolean not null default false;

-- ── 4) locations (lokasyonlar) ───────────────────────────────────
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;

drop policy if exists "locations_all_own_school" on public.locations;
create policy "locations_all_own_school" on public.locations
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.locations to authenticated;

-- ── 5) holidays (resmi tatiller / istisna günler) ────────────────
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  holiday_date date not null,
  description text not null default 'Tatil',
  created_at timestamptz not null default now(),
  unique (school_id, holiday_date)
);

alter table public.holidays enable row level security;

drop policy if exists "holidays_all_own_school" on public.holidays;
create policy "holidays_all_own_school" on public.holidays
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.holidays to authenticated;
