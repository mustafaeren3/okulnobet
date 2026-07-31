-- ═══════════════════════════════════════════════════════════════
-- CANLIYA UYGULAMA SONRASI DOĞRULAMA TEMİZLİĞİ — 3 küçük, kritik olmayan
-- bulgu (0020-0027 canlıya uygulandıktan SONRA `supabase db query` ile
-- tespit edildi, veri kaybı riski YOK, tamamen ek/geri alınabilir).
-- ═══════════════════════════════════════════════════════════════

-- 1) subscriptions sütun varsayılanları hâlâ eski değerlerde (plan_type
-- göçünden önceki 'trial'/'trialing') — artık CHECK constraint'e
-- uymuyorlar (0020'de sıkılaştırıldı). register_school() değerleri her
-- zaman açıkça belirlediği için normal kayıt akışı ETKİLENMİYORDU, ama
-- varsayılanı kullanan herhangi bir gelecekteki ham INSERT hataya
-- düşerdi. Var olan hiçbir satır değişmiyor, sadece gelecekteki
-- varsayılan değer düzeltiliyor.
alter table public.subscriptions alter column plan_type set default 'free';
alter table public.subscriptions alter column status set default 'active';

-- 2) platform_admins'te anon rolünün hâlâ TRUNCATE/REFERENCES/TRIGGER
-- izni var (orijinal Faz 8.5 migration'ı sadece authenticated'den revoke
-- etmişti). PostgREST bu üç izni hiç REST endpoint'i olarak sunmadığı
-- için pratikte istismar edilemez (aynı desen tüm public şemasında var,
-- Supabase'in proje-geneli varsayılan ayrıcalık kurulumu) ama en az
-- yetki ilkesine uysun diye açıkça kaldırılıyor.
revoke truncate, references, trigger on public.platform_admins from anon;

-- 3) current_school_id() — bu repoda TANIMLI DEĞİL (Supabase Dashboard'dan
-- elle kurulmuş, bkz. PHASE_REPORT.md Faz 8 notu), bu yüzden search_path'i
-- ve PUBLIC execute iznini normalde BURADA revoke ETMİYORDUK (yanlış
-- fonksiyonu hedeflemek TÜM uygulamanın RLS'ini bozabilirdi). Canlıda
-- `pg_get_functiondef` ile gövdesi doğrulandı: SECURITY DEFINER DEĞİL,
-- sadece `select school_id from school_users where user_id = auth.uid()`
-- — yani çağıranın KENDİ RLS'ine tabi, arama yolu ele geçirme riski
-- SECURITY DEFINER fonksiyonlardaki kadar kritik değil ama yine de en
-- iyi pratik search_path'i sabitlemek. Kullanıcı onayıyla düzeltiliyor.
-- Sadece authenticated'e execute veriliyor — anon zaten hiçbir tabloya
-- (enterprise_leads insert hariç) erişemediği için bu fonksiyona da
-- ihtiyacı yok.
alter function public.current_school_id() set search_path = public;
revoke execute on function public.current_school_id() from public;
grant execute on function public.current_school_id() to authenticated;
