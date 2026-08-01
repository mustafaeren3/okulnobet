-- ═══════════════════════════════════════════════════════════════
-- FAZ 2.3 — CMS + SEO + MEDYA + BLOG
-- ═══════════════════════════════════════════════════════════════
-- 4 YENİ TABLO — gerekçe:
--
-- 1) site_content: landing page (hero/özellikler/referanslar/sss/footer/
--    iletişim/sosyal medya) + yasal metinler (KVKK/gizlilik/çerez) +
--    genel ayarlar (site adı/SMTP/analytics ID'leri) TEK esnek key→jsonb
--    deposu. Bu içerikler yapısal olarak birbirinden çok farklı (hero'nun
--    başlık/alt başlık/CTA'sı, SSS'nin soru-cevap dizisi, footer'ın link
--    grupları) — her biri için ayrı, dar bir tablo açmak (10+ tablo)
--    aşırı parçalanma yaratırdı. Tek KV tablo + jsonb, hem CMS hem Genel
--    Ayarlar için aynı desenle çalışıyor (ayrı bir 5. "settings" tablosu
--    gerekmedi).
-- 2) seo_meta: her SAYFA için title/description/OG/Twitter/JSON-LD/noindex —
--    path'e göre anahtarlanan, site_content'ten kavramsal olarak AYRI bir
--    varlık (bir sayfanın içeriği değişmeden SEO'su değişebilir, ya da
--    tersi) ve gelecekte blog yazıları da kendi path'iyle buraya girecek.
-- 3) media_library: Supabase Storage'ın kendisi dosya adı/alt metin gibi
--    düzenlenebilir metadata tutmuyor — WordPress benzeri kütüphane için
--    (yeniden adlandırma, alt text, silme) bu iz tablosu gerekli.
-- 4) blog_posts: taslak/yayın durumu, kategori/etiket, listeleme/filtreleme
--    ihtiyacı olan, site_content'in esnek KV modeline UYMAYAN, kendi
--    başına bir varlık.
--
-- RLS deseni (bilinçli, mevcut yapıdan SAPMA): site_content/seo_meta/
-- blog_posts (yayınlanmış) HERKESE (anon dahil) okunabilir olmalı — bunlar
-- canlı sitenin kendisini besliyor. Bu yüzden bu 4 tablo için yazma
-- SECURITY DEFINER RPC yerine DOĞRUDAN RLS policy'siyle (platform_admins
-- üyeliği + aal2 kontrolü policy'nin içinde) korunuyor — basit CRUD'lar
-- için 15+ dar RPC yazmak yerine. Karmaşık iş kuralı içeren mutasyonlar
-- (register_school, platform_grant_admin vb.) HÂLÂ SECURITY DEFINER
-- RPC deseninde kalıyor, bu SADECE içerik tabloları için bir istisna.

create or replace function public.platform_is_admin_aal2()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from platform_admins
    where user_id = auth.uid() and revoked_at is null
  ) and coalesce(auth.jwt()->>'aal', '') = 'aal2';
$$;
grant execute on function public.platform_is_admin_aal2() to authenticated;
revoke execute on function public.platform_is_admin_aal2() from public;

-- ── 1) site_content ──────────────────────────────────────────────
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.site_content enable row level security;
revoke all on public.site_content from authenticated, anon;
create policy "site_content_public_read" on public.site_content for select using (true);
create policy "site_content_admin_write" on public.site_content for insert with check (platform_is_admin_aal2());
create policy "site_content_admin_update" on public.site_content for update using (platform_is_admin_aal2()) with check (platform_is_admin_aal2());
grant select on public.site_content to authenticated, anon;
grant insert, update on public.site_content to authenticated;

-- ── 2) seo_meta ──────────────────────────────────────────────────
create table if not exists public.seo_meta (
  path text primary key,
  title text,
  description text,
  keywords text,
  canonical text,
  og_title text,
  og_description text,
  og_image text,
  twitter_card text default 'summary_large_image',
  json_ld jsonb,
  noindex boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.seo_meta enable row level security;
revoke all on public.seo_meta from authenticated, anon;
create policy "seo_meta_public_read" on public.seo_meta for select using (true);
create policy "seo_meta_admin_write" on public.seo_meta for insert with check (platform_is_admin_aal2());
create policy "seo_meta_admin_update" on public.seo_meta for update using (platform_is_admin_aal2()) with check (platform_is_admin_aal2());
grant select on public.seo_meta to authenticated, anon;
grant insert, update on public.seo_meta to authenticated;

-- ── 3) media_library ─────────────────────────────────────────────
create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  original_name text not null,
  alt_text text not null default '',
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.media_library enable row level security;
revoke all on public.media_library from authenticated, anon;
create policy "media_library_admin_all" on public.media_library for all
  using (platform_is_admin_aal2()) with check (platform_is_admin_aal2());
grant select, insert, update, delete on public.media_library to authenticated;

-- ── 4) blog_posts ────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  category text,
  tags text[] not null default '{}',
  meta_title text,
  meta_description text,
  author_id uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_blog_posts_status_published on public.blog_posts(status, published_at desc);
alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from authenticated, anon;
create policy "blog_posts_public_read_published" on public.blog_posts
  for select using (status = 'published' or platform_is_admin_aal2());
create policy "blog_posts_admin_write" on public.blog_posts for insert with check (platform_is_admin_aal2());
create policy "blog_posts_admin_update" on public.blog_posts for update using (platform_is_admin_aal2()) with check (platform_is_admin_aal2());
create policy "blog_posts_admin_delete" on public.blog_posts for delete using (platform_is_admin_aal2());
grant select, insert, update, delete on public.blog_posts to authenticated;
grant select on public.blog_posts to anon;

-- ── Storage: 'media' bucket ───────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_bucket_public_read" on storage.objects;
create policy "media_bucket_public_read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media_bucket_admin_insert" on storage.objects;
create policy "media_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'media' and platform_is_admin_aal2());

drop policy if exists "media_bucket_admin_update" on storage.objects;
create policy "media_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'media' and platform_is_admin_aal2());

drop policy if exists "media_bucket_admin_delete" on storage.objects;
create policy "media_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'media' and platform_is_admin_aal2());
