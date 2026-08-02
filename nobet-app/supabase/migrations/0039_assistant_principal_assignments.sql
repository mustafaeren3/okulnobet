-- ═══════════════════════════════════════════════════════════════
-- ASSISTANT_PRINCIPAL_ASSIGNMENTS (motorun ürettiği/idarecinin elle
-- düzenlediği günlük görevli müdür yardımcısı ataması)
-- ═══════════════════════════════════════════════════════════════
-- duty_assignments'tan (0009) farkı: burada "zone" kavramı yok — bir
-- günde tek bir görevli müdür yardımcısı olur, bu yüzden unique kısıt
-- sadece (school_id, duty_date). is_manual, duty_assignments'taki ile
-- aynı anlamda: true ise üretim motoru bu satıra bir daha dokunmaz.

create table if not exists public.assistant_principal_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  assistant_principal_id uuid not null references public.assistant_principals(id) on delete cascade,
  duty_date date not null,
  is_manual boolean not null default false,
  created_at timestamptz not null default now(),
  unique (school_id, duty_date)
);

alter table public.assistant_principal_assignments enable row level security;

drop policy if exists "ap_assignments_all_own_school" on public.assistant_principal_assignments;
create policy "ap_assignments_all_own_school" on public.assistant_principal_assignments
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.assistant_principal_assignments to authenticated;
