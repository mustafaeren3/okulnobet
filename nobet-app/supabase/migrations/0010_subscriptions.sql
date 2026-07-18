-- ═══════════════════════════════════════════════════════════════
-- ABONELİK (subscriptions) — şema + plan durumu, ÖDEME ENTEGRASYONU YOK
-- ═══════════════════════════════════════════════════════════════
-- Faz 2'de "ayrı bir migration'da (0010) gelecek" diye ertelenmişti
-- (bkz. PHASE_REPORT.md Faz 2). Bu migration sadece veri modelini ve
-- "deneme süresi" varsayılanını kurar; gerçek bir ödeme sağlayıcısı
-- (iyzico/Stripe/PayTR vb.) entegrasyonu bilinçli olarak kapsam dışı —
-- ayrı, büyük bir ürün kararı gerektiriyor.
--
-- plan_type: şu an sadece 'trial' üretiliyor; 'standard' ileride
-- gerçek bir ücretli plan tanımlanınca kullanılacak yer tutucu.
-- status: 'trialing' (deneme sürüyor) / 'active' (ödemeli, aktif) /
-- 'expired' (süresi doldu, ödeme yapılmadı) / 'canceled' (iptal edildi).
-- current_period_end: sadece status='active' olduğunda anlamlı (bir
-- sonraki ödeme/yenileme tarihi) — deneme sürümünde null kalır,
-- trial_ends_at kullanılır.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null unique references public.schools(id) on delete cascade,
  plan_type text not null default 'trial' check (plan_type in ('trial', 'standard')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'expired', 'canceled')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own_school" on public.subscriptions;
create policy "subscriptions_select_own_school" on public.subscriptions
  for select using (school_id = public.current_school_id());

-- İdareci kendi planını yükseltemez/değiştiremez — bu satırlar sadece
-- register_school (SECURITY DEFINER) tarafından oluşturulur, gerçek
-- ödeme entegrasyonu gelince ayrı bir SECURITY DEFINER fonksiyon
-- (örn. activate_subscription) insert/update yapacak. Şimdilik yazma
-- izni authenticated'e verilmiyor — kasıtlı.
grant select on public.subscriptions to authenticated;

-- ── register_school'u güncelle: yeni okula 14 günlük deneme başlat ──
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

  insert into subscriptions (school_id, plan_type, status, trial_ends_at)
  values (new_school_id, 'trial', 'trialing', now() + interval '14 days');

  return new_school_id;
end;
$$;

grant execute on function public.register_school(text, text, text) to authenticated;
