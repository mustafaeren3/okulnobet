-- ═══════════════════════════════════════════════════════════════
-- OKUL PROFİLİ (schools tablosuna ek sütunlar)
-- ═══════════════════════════════════════════════════════════════
-- schools tablosu taban şemada zaten var (bkz. 0001'in başındaki not —
-- taban şema henüz repo'da yok, kullanıcıdan bekleniyor). Bu migration
-- sadece yeni sütun ekliyor, tabloyu yeniden oluşturmuyor.
--
-- school_type ve education_shift, kurulum sihirbazının (Faz 3) hangi
-- bölge/kural şablonunu yükleyeceğini belirleyen ayırt edici alanlar.
-- profile jsonb, sık değişmeyen ama şablon seçimini etkilemeyen esnek
-- bina/özellik bilgilerini tutar (kat/blok sayısı, pansiyon/yemekhane/
-- spor salonu/atölye/laboratuvar/mescit bayrakları vb.) — her yeni
-- özellik bayrağı için migration gerekmesin diye ayrı sütun değil,
-- tek bir esnek alan.

alter table public.schools add column if not exists school_type text
  check (school_type in ('ilkokul','ortaokul','anadolu_lisesi','fen_lisesi','meslek_lisesi','imam_hatip','ozel','diger'));

alter table public.schools add column if not exists education_shift text not null default 'normal'
  check (education_shift in ('normal','ikili'));

alter table public.schools add column if not exists profile jsonb not null default '{}'::jsonb;
