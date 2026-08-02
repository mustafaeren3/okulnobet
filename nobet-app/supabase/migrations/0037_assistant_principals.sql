-- ═══════════════════════════════════════════════════════════════
-- ASSISTANT_PRINCIPALS ("Görevli Müdür Yardımcısı" modülü — kişi listesi)
-- ═══════════════════════════════════════════════════════════════
-- Öğretmen nöbetinden TAMAMEN BAĞIMSIZ, paralel bir modülün ilk tablosu
-- (bkz. 0038/0039). `teachers` tablosunu genişletmek yerine ayrı bir
-- tablo açıldı: branch/weekly_capacity/restriction_mode/fixed_zone_id
-- gibi öğretmen-motoruna özgü alanlar bu role hiç uygulanmıyor, onları
-- burada da taşımak (veya teachers'a yeni bir "role" ayrımı eklemek)
-- iki farklı kavramı tek tabloda karıştırırdı. `teachers`/`duty_zones`
-- (0004) ile birebir aynı RLS deseni kullanılıyor.

create table if not exists public.assistant_principals (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  full_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.assistant_principals enable row level security;

drop policy if exists "assistant_principals_all_own_school" on public.assistant_principals;
create policy "assistant_principals_all_own_school" on public.assistant_principals
  for all using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.assistant_principals to authenticated;
