-- ═══════════════════════════════════════════════════════════════
-- ENTERPRISE_LEADS — Kurumsal ("Teklif Al") sayfasındaki formun kaydı.
-- ═══════════════════════════════════════════════════════════════
-- purchase_intents'ten (0017) farklı olarak GİRİŞSİZ (anon) ziyaretçi de
-- doldurabilir — marketing sayfası, henüz hesap açmamış biri için.

create table if not exists public.enterprise_leads (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  contact_name text,
  phone text,
  email text,
  teacher_count_estimate int,
  note text,
  status text not null default 'new' check (status in ('new', 'contacted', 'done')),
  created_at timestamptz not null default now()
);

alter table public.enterprise_leads enable row level security;

-- Herkes (anon dahil) yazabilir, kimse doğrudan okuyamaz — okuma sadece
-- süper admin RPC'si (platform_list_enterprise_leads) üzerinden, aynı
-- trial_registrations/purchase_intents deseni.
drop policy if exists "enterprise_leads_insert_anyone" on public.enterprise_leads;
create policy "enterprise_leads_insert_anyone" on public.enterprise_leads
  for insert with check (true);

grant insert on public.enterprise_leads to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Süper admin okuma RPC'leri — 0016'daki platform_* desenin devamı:
-- dar kapsamlı SECURITY DEFINER, her biri platform_is_admin() kontrolü
-- yapmadan hiçbir şey döndürmez.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.platform_list_enterprise_leads()
returns setof public.enterprise_leads
language plpgsql
security definer
set search_path = public
as $$
begin
  if not platform_is_admin() then
    raise exception 'Yetkiniz yok.';
  end if;
  return query select * from enterprise_leads order by created_at desc;
end;
$$;
grant execute on function public.platform_list_enterprise_leads() to authenticated;

create or replace function public.platform_list_purchase_intents()
returns table (
  id uuid,
  school_id uuid,
  school_name text,
  contact_name text,
  contact_phone text,
  note text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not platform_is_admin() then
    raise exception 'Yetkiniz yok.';
  end if;
  return query
  select pi.id, pi.school_id, s.name, pi.contact_name, pi.contact_phone, pi.note, pi.status, pi.created_at
  from purchase_intents pi
  join schools s on s.id = pi.school_id
  order by pi.created_at desc;
end;
$$;
grant execute on function public.platform_list_purchase_intents() to authenticated;
