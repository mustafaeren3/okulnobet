-- ═══════════════════════════════════════════════════════════════
-- EXCEPTIONS (istisna: rapor, izin, görevlendirme, muafiyet, takas)
-- ═══════════════════════════════════════════════════════════════
-- KVKK notu: 'muafiyet' tipi, hamilelik/engellilik gibi özel nitelikli
-- kişisel veri gerektirebilecek durumlar için kullanılır. Bu tabloda
-- ASLA tıbbi gerekçe/teşhis saklanmaz — sadece "bu tarih aralığında
-- muaf" bilgisi. `note` alanı idarecinin kendi kısa notu için vardır
-- (örn. evrak no), UI bu alana tıbbi gerekçe girilmesini teşvik
-- etmemelidir.

create table if not exists public.exceptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  exception_type text not null
    check (exception_type in ('rapor','izin','gorevlendirme','muafiyet','takas','diger')),
  start_date date not null,
  end_date date not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table public.exceptions enable row level security;

drop policy if exists "exceptions_all_own_school" on public.exceptions;
create policy "exceptions_all_own_school" on public.exceptions
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.exceptions to authenticated;
