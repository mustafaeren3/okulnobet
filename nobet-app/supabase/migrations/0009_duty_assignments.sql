-- ═══════════════════════════════════════════════════════════════
-- DUTY_ASSIGNMENTS (motorun ürettiği/idarecinin elle düzenlediği atamalar)
-- ═══════════════════════════════════════════════════════════════
-- unique(teacher_id, duty_date, slot_key): aynı öğretmen aynı gün+dilimde
-- iki kez atanamaz (çift nöbet farklı slot_key veya farklı zone ile temsil
-- edilir, aynı teacher+date+slot çifti değil). is_manual = true olan
-- satırlara Scheduling Engine (Faz 5) bir daha dokunmaz.

create table if not exists public.duty_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  zone_id uuid not null references public.duty_zones(id) on delete cascade,
  duty_date date not null,
  slot_key text not null default 'full_day',
  is_manual boolean not null default false,
  score_detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (teacher_id, duty_date, slot_key)
);

alter table public.duty_assignments enable row level security;

drop policy if exists "duty_assignments_all_own_school" on public.duty_assignments;
create policy "duty_assignments_all_own_school" on public.duty_assignments
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.duty_assignments to authenticated;
