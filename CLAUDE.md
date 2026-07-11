# CLAUDE.md — Nöbet Sistemi Mühendislik Anayasası

## Ürün bağlamı
Türkiye'deki okullar için nöbet/görev yönetim SaaS'ı. Kullanıcı: teknik olmayan
müdür yardımcıları. Öncelik: doğruluk > basitlik > hız > zarafet.

Uygulama kökü: `nobet-app/` (Next.js 14 App Router + Supabase). Bu repo kökü
(`nobet-app-skeleton/`) sadece `.claude/` konfigürasyonunu ve bu dosyayı
barındırır.

## Mimari kurallar (pazarlıksız)
1. `lib/engine/` SAF fonksiyondur. Supabase, Next.js, fetch, env — hiçbirini bilmez.
   Girdi: düz veri. Çıktı: düz veri. Tüm engine testleri veritabanısız koşar.
2. Veritabanına yalnızca `lib/db/` dokunur. Component/page içinden doğrudan
   Supabase çağrısı yasak (yeni kod için — mevcut kod kademeli taşınıyor,
   bkz. PHASE_REPORT.md teknik borç bölümü).
3. Şema değişikliği yalnızca `supabase/migrations/` ile yapılır. Dashboard'dan
   elle değişiklik yasak.
4. Her tabloda `school_id` + RLS zorunlu. Yeni tablo = migration içinde RLS
   politikası, yoksa PR eksiktir.
5. Yeni kural = `lib/engine/rules/` altına yeni dosya + `rules` tablosuna satır.
   Motor çekirdeğine dokunulmaz.

## Sadelik kuralları (YAGNI)
- Repository interface, DTO/mapper katmanı, DI container, CQRS, event sourcing YASAK.
- Bir soyutlama ancak İKİNCİ somut kullanım ortaya çıktığında eklenir.
- Aynı sonucu veren iki çözümden her zaman basit olanı seç ve kararı tek satırla
  raporda belirt.
- Dosya 300 satırı geçiyorsa böl; sınıf yerine fonksiyon tercih et.

## Ortak dil (kod = veritabanı = UI)
school, teacher, duty (görev), zone (alan), slot, time_slot (dilim),
day_type (gün tipi), exception (istisna/muafiyet), rotation, rule (hard/soft),
assignment (atama), is_manual (kilitli hücre).
Bu terimlere eşanlamlı üretme. Yorumlar ve raporlar Türkçe, tanımlayıcılar İngilizce.

## Test standardı
- `lib/engine/`: Vitest, kapsam hedefi %90+. Her kural handler'ının en az
  1 geçer + 1 eler testi.
- `lib/db/`: tenant izolasyon testi her yeni tabloda güncellenir (A okulu B'yi göremez).
- e2e (Playwright): yalnızca kritik akışlar — sihirbaz, çizelge üretimi,
  rapor/muafiyet girişi, PDF çıktı.
- Kırmızı test varken faz "bitti" sayılmaz.

## Faz sonu teslimatı
Her fazın sonunda `PHASE_REPORT.md` dosyasının ilgili bölümünü güncelle (max 1 sayfa):

### Faz N — [ad]
- Tamamlanan: 3-5 madde
- Teknik borç: bilinçli kısayol + hangi fazda ödenecek
- Test kapsamı: engine % / db izolasyon ✓ / e2e akış listesi
- Sonraki faz riskleri: en fazla 3 risk, her biri 1 cümle + azaltma önerisi

Tören metni, giriş paragrafı, özet tekrarı yazma.

## Davranış kuralları
- Var olan çalışan kodu, görev kapsamı dışındaysa yeniden yazma/yeniden adlandırma.
- Emin olmadığın ürün kararında kod yazmadan önce TEK soru sor, varsayımla ilerleme.
- Her görev sonunda değişen dosyaları listele.
