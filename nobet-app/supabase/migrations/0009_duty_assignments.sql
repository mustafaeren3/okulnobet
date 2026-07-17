-- ═══════════════════════════════════════════════════════════════
-- DUTY_ASSIGNMENTS (motorun ürettiği/idarecinin elle düzenlediği atamalar)
-- ═══════════════════════════════════════════════════════════════
-- unique(teacher_id, duty_date, slot_key, zone_id): aynı öğretmen aynı
-- gün+dilim+bölgeye iki kez atanamaz (kopya kayıt engellenir), ama
-- teachers.allow_double_duty = true olan bir öğretmen aynı gün+dilimde
-- FARKLI bir zone_id ile ikinci kez atanabilir — çift nöbet (x2) bu
-- şekilde temsil edilir. zone_id'yi kısıttan çıkarmak (eski hâli)
-- çift nöbeti şema seviyesinde imkansız kılıyordu; kısıta eklendi.
-- "İkinci atama sadece allow_double_duty=true olan öğretmene izin
-- verilsin" kuralı DB seviyesinde değil, Scheduling Engine'de (Faz 5)
-- uygulanır — burada sadece kopya kaydı engelliyoruz.
-- is_manual = true olan satırlara Scheduling Engine bir daha dokunmaz.

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
