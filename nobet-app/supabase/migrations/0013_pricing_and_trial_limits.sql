-- ═══════════════════════════════════════════════════════════════
-- FİYATLANDIRMA + DENEME SUİSTİMALİ ENGELLEME
-- ═══════════════════════════════════════════════════════════════
-- Kullanıcının fiyatlandırma tarifesi (öğretmen sayısına göre 4 kademe,
-- aylık/yıllık) BİLEREK ayrı bir "tier" sütunu olarak SAKLANMIYOR —
-- okulun öğretmen sayısı zamanla değişir, saklanan bir tier hemen
-- bayatlar. Doğru fiyat her zaman CANLI hesaplanır (bkz.
-- lib/engine/pricing.js). Burada sadece SEÇİLEN faturalama aralığı
-- (aylık/yıllık) ve gerçek ödeme sağlayıcısı (PayTR/iyzico) bağlanınca
-- kullanılacak referans alanları ekleniyor — henüz gerçek ödeme
-- entegrasyonu YOK, bu turun kapsamı sadece şema + fiyat hesaplama.

alter table public.subscriptions add column if not exists billing_interval text
  check (billing_interval in ('monthly', 'yearly'));
alter table public.subscriptions add column if not exists provider text
  check (provider in ('paytr', 'iyzico'));
alter table public.subscriptions add column if not exists provider_customer_id text;
alter table public.subscriptions add column if not exists provider_subscription_id text;

-- ── Deneme suistimalini önleme ───────────────────────────────────
-- Kullanıcı isteği: "her e-posta ve telefon numarası sadece 1 aylık
-- program oluşturabilir" — hem (a) deneme sırasında üretilen programın
-- tarih aralığı en fazla 1 ay olabilir (bkz. lib/db/subscriptions.js
-- requireUsableSubscription), hem de (b) bir e-posta/telefonla BİR KEZ
-- deneme hesabı açılabilir — okul/hesap SİLİNSE BİLE bu kayıt kalıcı
-- olarak durur (yeni bir e-posta ile tekrar deneme açmayı engellemek
-- için schools/subscriptions'a cascade EDİLMEDİ, bilerek ayrı tablo).
create table if not exists public.trial_registrations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text not null,
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_trial_registrations_email on public.trial_registrations(lower(email));
create unique index if not exists idx_trial_registrations_phone on public.trial_registrations(phone);

alter table public.trial_registrations enable row level security;
-- Kimse doğrudan okuyup yazamaz — sadece register_school (SECURITY
-- DEFINER, RLS'i bypass eder) dokunur, authenticated'e hiç izin yok.
revoke all on public.trial_registrations from authenticated;

-- ── register_school: telefon alır + deneme suistimalini kontrol eder ──
-- İmza değişti (p_phone eklendi) — eski 3 parametreli sürüm önce
-- düşürülüyor, yoksa Postgres iki ayrı fonksiyon (overload) olarak
-- ikisini de tutar ve eski, suistimal kontrolü OLMAYAN sürüm hâlâ
-- çağrılabilir kalır.
drop function if exists public.register_school(text, text, text);

create or replace function public.register_school(
  p_name text,
  p_city text,
  p_district text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_school_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapılmamış kullanıcı okul oluşturamaz';
  end if;

  if exists (select 1 from school_users where user_id = auth.uid()) then
    raise exception 'Bu kullanıcı zaten bir okula bağlı';
  end if;

  if p_phone is null or length(trim(p_phone)) = 0 then
    raise exception 'Telefon numarası gerekli';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  if exists (
    select 1 from trial_registrations
    where lower(email) = lower(v_email) or phone = p_phone
  ) then
    raise exception 'Bu e-posta adresi veya telefon numarasıyla daha önce bir deneme hesabı oluşturulmuş. Devam etmek için abonelik satın almanız gerekiyor.';
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

  insert into trial_registrations (email, phone, school_id)
  values (v_email, p_phone, new_school_id);

  return new_school_id;
end;
$$;

grant execute on function public.register_school(text, text, text, text) to authenticated;
