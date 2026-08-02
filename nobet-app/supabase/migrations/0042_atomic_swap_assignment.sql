-- ═══════════════════════════════════════════════════════════════
-- ATOMİK "DEĞİŞTİR" — swap_duty_assignment
-- ═══════════════════════════════════════════════════════════════
-- NOT: Görevli Müdür Yardımcısı modülünde aynı sorun YOK — oradaki
-- "Değiştir" zaten TEK bir UPSERT statement'ı (lib/db/assistantPrincipal
-- Assignments.js createManualAssignment, unique(school_id, duty_date)
-- üzerinde onConflict) — tek statement zaten atomik, ayrı bir swap
-- RPC'sine gerek yok. O modülde eksik olan (kişinin current_school_id()
-- okuluna ait olduğu doğrulaması) ayrı, daha küçük bir düzeltmeyle
-- (lib/db/ownership.js) kapatıldı — burada gereksiz bir ikinci RPC
-- eklenmedi (YAGNI).
-- Kalite denetimi bulgusu: Program tablosundaki "Değiştir" akışı iki ayrı
-- istekti (removeAssignment sonra addManualAssignment) — ikinci istek
-- başarısız olursa (ağ hatası, unique constraint çakışması) eski atama
-- zaten silinmiş oluyor, hücre BOŞ kalıyordu. Çözüm: tek bir SQL
-- fonksiyonu içinde sil+ekle — bir PL/pgSQL fonksiyon gövdesi tek bir
-- transaction'da çalışır, herhangi bir adım (özellikle INSERT'in unique
-- constraint'e çarpması) hata verirse TÜM gövde (DELETE dahil) otomatik
-- rollback olur — eski atama olduğu gibi kalır. Ayrıca, mevcut kodda hiç
-- olmayan bir kontrolü de burada ekliyoruz: yeni öğretmenin GERÇEKTEN
-- current_school_id() okuluna ait olduğu server-side doğrulanıyor (önceden
-- sadece RLS'in dolaylı koruması vardı, açık bir hata mesajı yoktu).
--
-- SECURITY INVOKER (varsayılan, açıkça yazılmadı) — duty_assignments
-- üzerindeki mevcut RLS + grant'ler (0009) zaten yeterli; fonksiyon
-- çağıranın kendi yetkisiyle çalışır, çapraz-okul ayrıcalık gerekmiyor.
--
-- Eşzamanlılık: `for update` ile atama satırı kilitlenir — aynı hücre için
-- iki "Değiştir" isteği aynı anda gelirse ikincisi birincinin transaction'ı
-- bitene kadar bekler, sonra güncel veriyle devam eder (satır zaten
-- silinmişse "Atama bulunamadı" hatası alır — sessiz veri bozulması olmaz).
create or replace function public.swap_duty_assignment(p_assignment_id uuid, p_new_teacher_id uuid)
returns table (
  id uuid,
  duty_date date,
  is_manual boolean,
  teacher_id uuid,
  teacher_full_name text,
  zone_id uuid,
  zone_name text
)
language plpgsql
as $$
declare
  v_school_id uuid;
  v_zone_id uuid;
  v_duty_date date;
  v_slot_key text;
  v_new_id uuid;
begin
  select da.school_id, da.zone_id, da.duty_date, da.slot_key
    into v_school_id, v_zone_id, v_duty_date, v_slot_key
  from public.duty_assignments da
  where da.id = p_assignment_id
  for update;

  if not found then
    raise exception 'Atama bulunamadı.';
  end if;
  if v_school_id <> public.current_school_id() then
    raise exception 'Bu atama başka bir okula ait.';
  end if;

  if not exists (
    select 1 from public.teachers
    where id = p_new_teacher_id and school_id = public.current_school_id()
  ) then
    raise exception 'Seçilen öğretmen bu okula ait değil.';
  end if;

  delete from public.duty_assignments where id = p_assignment_id;

  insert into public.duty_assignments (school_id, teacher_id, zone_id, duty_date, slot_key, is_manual)
  values (v_school_id, p_new_teacher_id, v_zone_id, v_duty_date, v_slot_key, true)
  returning duty_assignments.id into v_new_id;

  return query
    select da.id, da.duty_date, da.is_manual, da.teacher_id, t.full_name, da.zone_id, z.name
    from public.duty_assignments da
    join public.teachers t on t.id = da.teacher_id
    join public.duty_zones z on z.id = da.zone_id
    where da.id = v_new_id;
end;
$$;

grant execute on function public.swap_duty_assignment(uuid, uuid) to authenticated;
