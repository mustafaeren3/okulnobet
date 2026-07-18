# PHASE_REPORT.md

## Faz 5 — Scheduling Engine (aday listesi tarama, devam ediyor)

### Tamamlanan

1. **`lib/db/eligibility.js` — `getEligibleTeachersForZone(supabase, { schoolId, zoneId, date })`.** Bir bölge+tarih için okuldaki TÜM öğretmenleri tarayıp her biri için `{ teacher, eligible, violations }` döndürür. Henüz seçim/atama yapmıyor (kullanıcı onayıyla bilinçli — rotasyon algoritması ayrı bir karar, bu turun kapsamı dışında).
2. Performans: öğretmen başına ayrı sorgu atmak yerine 4 toplu sorgu kullanılıyor (`Promise.all` ile paralel) — yeni toplu okuma fonksiyonları:
   - `lib/db/teacherAvailability.js`: `getUnavailableWeekdaysForTeachers(supabase, teacherIds)` — `teacher_unavailable_days`'i `.in('teacher_id', ...)` ile tek sorguda çekip `teacherId → weekday[]` map'ine indirger.
   - `lib/db/dutyAssignments.js`: `getAssignmentCountsForDate(supabase, schoolId, date)` — bir okulun bir tarihteki tüm atamalarını tek sorguda çekip `teacherId → sayı` map'ine indirger.
3. `tests/db/eligibility.test.js`'e yeni `describe` bloğu: 2 öğretmenli (biri uygun, biri `EXCEPT` kısıtıyla uygun değil) ayrı bir test okulunda tarama — sonuç dizisinin doğru uzunlukta olduğu ve her öğretmenin doğru `eligible`/`violations` aldığı doğrulandı.
4. **`lib/engine/selectFairest.js`** — basit adillik seçimi: uygun adaylar arasından o ana kadar toplamda en az nöbet tutmuş olan(lar)ı seçer (`rotations` tablosu tabanlı gerçek rotasyon algoritması kullanıcı onayıyla bilinçli olarak ertelendi). Saf fonksiyon, eşitlikte isim sırasına göre (tr) deterministik seçim. 5/5 test (mutasyon yapmama testi dahil).
5. **`lib/db/dutyAssignments.js`**: `getTotalAssignmentCounts(supabase, schoolId)` — bir okulun tüm zamanlardaki atamalarını tek sorguda çekip `teacherId → toplam sayı` map'ine indirger (adillik ölçütü için).
6. **`lib/db/eligibility.js`**: `selectTeachersForZone(supabase, { schoolId, zoneId, date })` — `getEligibleTeachersForZone` + `getTotalAssignmentCounts` + `selectFairest`'i birleştirip `zone.required_count` kadar öğretmen seçer.
7. `tests/db/eligibility.test.js`'e üçüncü `describe` bloğu: iki uygun aday (biri geçmişte 1 nöbet tutmuş, biri hiç tutmamış), `required_count=1` iken hiç tutmayanın seçildiği gerçek Supabase'e karşı doğrulandı.
8. **`lib/db/dutyAssignments.js`**: `createAssignments(supabase, schoolId, assignments)` — seçilen atamaları tek sorguda `duty_assignments`'a yazar (`is_manual=false`, motorun ürettiğini belirtir).
9. **`lib/db/scheduling.js`** (yeni dosya) — `assignTeachersToZone(supabase, { schoolId, zoneId, date })`: `selectTeachersForZone` + `createAssignments`'ı birleştirip seçilen kararı kalıcı olarak kaydeder. Okuma (`eligibility.js`) ve yazma (`scheduling.js`) sorumlulukları bilinçli olarak ayrı dosyalarda tutuldu.
10. `tests/db/scheduling.test.js`: gerçek Supabase'e karşı 2 senaryo — 3 adaydan `required_count=2` kadarının seçilip DB'ye yazıldığı (dönüş değeri değil, ayrı bir sorguyla tekrar okunarak doğrulandı), ve uygun aday yokken hata fırlatmadan boş dizi döndüğü. Tam paket 68/68 yeşil.

### Bilinçli kararlar / teknik borç

- **Seçim ölçütü basit adillik (toplam nöbet sayısı), gerçek rotasyon değil.** `rotations` tablosundaki `zone_cursor`/`day_cursor`/`rotation_mode` (haftalık/aylık yer) henüz okunmuyor — kullanıcı onayıyla bu turun kapsamı dışında bırakıldı, ayrı bir ürün kararı gerektiriyor.
- **`assignTeachersToZone` idempotent değil / "zaten dolu mu" kontrolü yok.** Aynı bölge+tarih için iki kez çağrılırsa, `duty_assignments` unique kısıtı (teacher_id, duty_date, slot_key, zone_id) aynı öğretmenin tekrar atanmasını engeller ama fonksiyon o tarihte zonenin zaten `required_count` kadar dolu olup olmadığını kontrol etmeden yeni adaylar seçmeye çalışır — art arda çağrılırsa gereğinden fazla öğretmen atanabilir. Toplu program üretimi (bir tarih aralığı için tek seferlik çalıştırma) devreye girene kadar risk düşük.
- **`rules` tablosuyla bağlantı hâlâ yok** (Faz 4'ten devreden risk, aşağıya bakın).

### Test kapsamı

- `lib/engine/`: `selectFairest.js` 5/5.
- `lib/db/`: `eligibility.test.js` 5/5, `scheduling.test.js` 2/2.
- Tam paket: 68/68 yeşil.

### Sonraki adım riskleri

1. **Gerçek rotasyon algoritması yok** → basit adillik (toplam nöbet sayısı) çalışıyor ama ürünün istediği "haftalık/aylık yer rotasyonu" (aynı öğretmenin art arda farklı bölgelere geçmesi gibi) henüz yok → azaltma: `rotations` tablosunun nasıl kullanılacağına (cursor ilerletme mantığı) dair ayrı bir ürün kararı + bir sonraki artış.
2. **Toplu program üretimi yok.** `assignTeachersToZone` tek bir bölge+tarih için çalışıyor; bir tarih aralığı + tüm bölgeler için otomatik program üretmek (eski `(panel)` dashboard'daki "PROGRAM OLUŞTUR" butonunun yeni şemadaki karşılığı) henüz yazılmadı → azaltma: bir sonraki artış bunu ele almalı, "zaten dolu mu" idempotency kontrolünü de bu sırada eklemek gerekir.
3. **`rules` tablosuyla bağlantı yok** (Faz 4'ten devreden risk) → aşağıdaki Faz 4 bölümüne bakın.

---

## Faz 4 — Rule Engine (hard rule seti tamamlandı)

### Tamamlanan

1. **`lib/engine/rules/`** — 6 hard rule, her biri ayrı dosyada (CLAUDE.md kural 5: "yeni kural = yeni dosya"), tamamı saf fonksiyon (DB/Next.js/fetch bilmiyor, düz veri alıp düz veri döndürüyor):
   - `teacherAvailability.js` — `teacher.restriction_mode` (ALL/ONLY/EXCEPT) + `unavailableWeekdays` listesine göre bir haftagününde müsaitlik.
   - `zoneClosure.js` — `zone_closures` tarih aralıklarına göre bölge kapalı mı.
   - `maxDutyPerDay.js` — `allow_double_duty`'e göre günlük maks. nöbet sayısı (false→1, true→2).
   - `activeStatus.js` — pasif (`is_active=false`) öğretmen veya bölgeye atama engellenir.
   - `zoneActiveDay.js` — bölge o haftagününde (`duty_zones.active_days`) çalışmıyorsa atama engellenir.
   - `branchMatch.js` — öğretmenin branşı `allowed_branches`/`blocked_branches` ile eşleşmiyorsa atama engellenir; karşılaştırma `lib/text.js`'teki `normalizeTr` ile yapılır (Türkçe ı/İ eşleşmesi güvenli).
2. **`lib/text.js`** eklendi — `normalizeTr` paylaşılan yardımcı. İkinci somut kullanım ortaya çıktığı için (`branchMatch.js` + zaten var olan `app/(wizard)/teachers/actions.js`'teki teşkilat şeması scraper'ı) YAGNI kuralına uygun olarak çıkarıldı; `actions.js` artık kendi kopyası yerine bunu import ediyor.
3. **`lib/engine/rules/index.js`** — `checkHardRules(context)`: 6 kuralı birlikte çalıştırıp `{ eligible, violations }` döndüren runner.
4. Testler: her kural dosyası için en az 1 geçer + 1 eler testi (CLAUDE.md test standardı), `branchMatch` için ayrıca Türkçe büyük/küçük harf regresyon testi (`SINIF` ↔ `sınıf`) — toplam `rules/` 30/30 yeşil.
5. **`lib/db/eligibility.js`** — `checkHardRules`'ı gerçek veriyle çağıran katman (Faz 4'te işaretlenen "Faz 5'in ilk işi" riski karşılandı). `checkAssignmentEligibility(supabase, { teacherId, zoneId, date })`: teacher/zone/unavailableWeekdays/closures/existingAssignmentCountForDate'i paralel (`Promise.all`) çekip saf `checkHardRules`'a aktarıyor. Yeni `lib/db` dosyaları: `zoneClosures.js`, `dutyAssignments.js` (sadece `getAssignmentCountForTeacherDate`, count sorgusu — satırları çekmiyor), `teachers.js`/`dutyZones.js`'e `getTeacherById`/`getDutyZoneById` eklendi.
6. **`lib/engine/weekday.js`** — `getWeekday(dateStr)`: `'YYYY-MM-DD'` → haftagünü, yerel `new Date(y,m-1,d)` ile (UTC parse'ın bilinen tarih-kayması riskine düşmüyor, bkz. `schedule.js` `mondayOf()` notu). 3/3 test.
7. `tests/db/eligibility.test.js`: gerçek Supabase'e karşı uçtan uca (DB → lib/engine/rules) 2 senaryo — tamamen uygun öğretmen/bölge, ve hem müsaitlik hem branş ihlali olan bir kombinasyon (ikisinin de `violations`'ta doğru listelendiği doğrulandı). Tam paket 59/59 yeşil.

### Bilinçli kararlar / teknik borç

- **`rules` tablosu henüz bağlanmadı.** Migration'da `rule_key`/`rule_type`/`params`/`weight` ile okul bazlı yapılandırılabilir kural fikri var, ama `lib/engine/rules/` şu an sabit/her zaman açık 6 kuralı çalıştırıyor — `rules` tablosundan okuyup hangi kuralların aktif olduğunu/parametrelerini dinamik uygulamak henüz yazılmadı (kullanıcı onayıyla bu turun kapsamı dışında bırakıldı).
- **Soft rule'lar (ağırlıklı/skorlama) tamamen kapsam dışı** — kullanıcı bu turda sadece hard rule istedi.
- **Coverage aracı kurulu değil** (`@vitest/coverage-v8` yok, önceden de yoktu) — %90+ hedefi sayısal olarak ölçülemiyor, ama her rule dosyasının her dalı (if/else kolu) testlerle elle kapsandı.

### Test kapsamı

- `lib/engine/`: `rules/` klasörü 30/30, `weekday.js` 3/3 (dal/senaryo bazlı tam kapsam, sayısal ölçüm yok). `schedule.js` testleri değişmedi.
- `lib/db/`: `eligibility.test.js` (Faz 5'te genişletildi, bkz. yukarısı).

### Sonraki adım riskleri

1. **`rules` tablosuyla bağlantı yok** → okul bazlı kural aç/kapa veya parametre değişikliği (örn. `max_weekly_duty`) şu an mümkün değil → azaltma: Scheduling Engine öncesi ya da içinde `rules` tablosunu okuyup `checkHardRules`'a aktaran bir katman (muhtemelen `lib/db/rules.js`) yazılmalı.
2. **Coverage sayısal olarak ölçülemiyor** → azaltma: `@vitest/coverage-v8` kurulumu ayrı bir kullanıcı kararı gerektiriyor (yeni bağımlılık), bu turda eklenmedi.

(Atama üretimi/rotasyon riski Faz 5 bölümüne taşındı, yukarısına bakın.)

---

## Faz 3 — Öğretmen Yönetimi (tamamlandı)

### Tamamlanan

1. **Migration'lar canlıya uygulandı.** 0003-0009, Supabase CLI (`supabase db query --linked -f ...`) ile tek tek çalıştırıldı ve her birinden sonra doğrulandı (tablo/kolon/policy kontrolü). `tenant-isolation-phase2.test.js`: 11/11 yeşil, tam paket 19/19 yeşil.
2. Uygulama sırasında bir hata bulundu ve düzeltildi: `duty_assignments` unique kısıtına `zone_id` eklemek önceki commit'te sadece yorum satırına yazılmış, gerçek `unique(...)` satırına uygulanmamıştı. Hem migration dosyası hem canlı tablo (`ALTER TABLE`, tablo boştu) düzeltildi.
3. **`lib/db/teachers.js`** ve **`lib/db/teacherAvailability.js`** yazıldı — `teachers` ve `teacher_unavailable_days` için saf CRUD katmanı, Supabase client'ı parametre olarak alıyor (test edilebilir, Next.js'e bağımlı değil).
4. **`app/(wizard)/teachers/`** — Öğretmen Yönetimi ekranı: liste, ekle, düzenle (aktif/pasif), sil, `restriction_mode` (ALL/ONLY/EXCEPT) + haftagünü seçici ile müsaitlik yönetimi. Server action'lar (`actions.js`) `lib/db` katmanını sarmalıyor, component doğrudan Supabase çağırmıyor.
5. `middleware.js`'e `/teachers/:path*` matcher'ı eklendi (eski `/dashboard/:path*` davranışına dokunulmadı).
6. `tests/db/teachers-crud.test.js`: `lib/db` katmanının gerçek Supabase'e karşı fonksiyonel doğruluğu (create/update/delete + weekday round-trip) — 4/4 yeşil.
7. Tarayıcıda uçtan uca elle doğrulandı: kayıt ol → `/teachers` → ONLY modunda öğretmen ekle (Pzt+Çar) → müsaitliği aç, günlerin doğru kaydedildiğini gör → pasifleştir/aktifleştir → sil. Hepsi beklendiği gibi çalıştı.
8. **Teşkilat şeması otomatik öğretmen çekme** — `/teachers`'a, okulun MEB k12.tr teşkilat şeması sayfasından öğretmen listesini otomatik çeken buton eklendi (eski `(panel)` dashboard'daki `fetchTeskilatOgretmenleri`'nin `teachers` şemasına uyarlanmış hali, `(panel)`'e dokunulmadı). Müdür/müdür yardımcıları/rehber/özel eğitim/anaokulu öğretmenleri filtreleniyor; "1/A SINIF ÖĞRETMENİ" gibi roller `sınıf` branşına indirgeniyor. Gerçek bir okul sitesine (durmusyasario.meb.k12.tr) karşı test edildi: 23 kişi bulundu, 4 hariç tutuldu, 17 doğru branşla eklendi.
9. **`lib/db/dutyZones.js`** ve **`app/(wizard)/duty-zones/`** — Nöbet Bölgeleri yönetim ekranı: liste, ekle, aktif/pasif, sil; bölge adı, gereken kişi sayısı, öncelik, aktif günler, izinli/yasaklı branş listeleri (virgülle ayrılmış metin → `text[]`). `middleware.js`'e `/duty-zones/:path*` eklendi. `tests/db/duty-zones-crud.test.js`: 4/4 yeşil. Tarayıcıda uçtan uca doğrulandı (ekle → pasifleştir → sil).
10. **8 açılı kod incelemesi** yapıldı (`git diff HEAD~5..HEAD`), 6 bulgu doğrulandı, 4'ü düzeltildi:
    - `lib/db/schoolContext.js` eklendi (`getSchoolForUser`, `requireSchoolId`) — `teachers/actions.js` ve `duty-zones/actions.js`'te birebir kopya olan `requireSchoolId` yardımcı fonksiyonu ile her iki `page.jsx`'teki doğrudan `school_users` sorgusu buraya taşındı. Önceden `.single()` sonucundaki Supabase hatası okunmadan yutuluyordu (RLS/ağ hatası "kullanıcı okula bağlı değil" gibi yanlış bir mesaja dönüşüyordu) — artık hata doğru fırlatılıyor. Bu aynı zamanda CLAUDE.md mimari kural 2'nin ("Veritabanına yalnızca lib/db/ dokunur") yeni kod için ihlaliydi, giderildi.
    - `teachers/actions.js`'te `fetchTeskilatOgretmenleri` içindeki `getTeachers` çağrısı try/catch dışındaydı — fonksiyonun geri kalanının tuttuğu `{error}` sözleşmesini bozup Next.js'in genel hata sayfasına düşürüyordu; try/catch'e alındı.
    - `duty-zones/DutyZonesManager.jsx`'te `parseInt(inpRequiredCount, 10) || 1` kullanıcının bilerek girdiği `0`'ı sessizce `1`'e çeviriyordu; artık `0` veya geçersiz değer net bir toast hatasıyla reddediliyor.
    - Düzeltilmedi (bilinçli, düşük öncelik): `normalizeBranch`'in rol metni beklenmedik bir sonekle bitiyorsa (parantez vb.) branşı temizleyemediği kenar durumu (spekülatif, gerçek MEB sayfasında görülmedi) ve `TeachersManager.jsx`/`DutyZonesManager.jsx` arasındaki toast/logout/CSS tekrarı (ikinci somut kullanım ortaya çıktı, YAGNI kuralına göre soyutlanabilir ama çalışan ve yeni doğrulanmış iki bileşeni riske atmamak için bu turda ertelendi).

### Bilinçli kararlar / teknik borç

- `teachers` ve `duty_zones` silme işlemi şu an **hard delete** (eski `staff`/`locations` panelindeki desenle tutarlı). `duty_assignments`/`exceptions`/`rotations` üzerindeki `on delete cascade` nedeniyle bir öğretmen silinirse geçmiş nöbet kayıtları da silinir — Faz 5'te gerçek nöbet verisi girilmeye başlanınca bunun yerine `is_active=false` (zaten var) tercih edilmesi gerekebilir, silme UI'dan kaldırılabilir. Şimdilik veri yok, risk düşük.
- Teşkilat şeması çekme özelliğinde bulunan bir hata düzeltildi: JS regex `/i` bayrağı Türkçe ı/İ eşleşmesini bilmediği için "SINIF" (dotless I) ↔ "sınıf" (dotless ı) case-fold olmuyordu; branş normalizasyonu önce `tr-TR` ile küçük harfe çevirip öyle eşleştirecek şekilde düzeltildi. Aynı tuzak ileride Türkçe metin eşleştiren başka bir yerde (örn. branş adı karşılaştırmaları) tekrar çıkabilir — `normalizeTr` yardımcısı olmadan `/i` bayrağına güvenilmemeli.
- `duty_zones.allowed_branches`/`blocked_branches` serbest metin girişi (virgülle ayrılmış) — `teachers.branch` ile birebir string eşleşmesi bekleniyor (örn. "sınıf" == "sınıf"), yazım farkı toleransı yok. Faz 4'te Rule Engine bunu okurken bu kısıtı hesaba katmalı.
- Test verisi: `ZZZ_TENANT_TEST_*` (Faz 1/2'den) + `ZZZ_UI_TEST_OKUL` / `zzz-ui-test-*@example.invalid` (tarayıcı doğrulamalarından) — Dashboard'dan elle temizlenmeli.
- Migration'ları uygulamak için kullanılan Supabase personal access token hâlâ aktif olabilir — Dashboard → Access Tokens'tan revoke edilmesi öneriliyor.

### Test kapsamı

- `lib/db/`: `teachers-crud.test.js` 4/4, `duty-zones-crud.test.js` 4/4 (fonksiyonel), `tenant-isolation-phase2.test.js` 11/11 (RLS).
- e2e: değişmedi (2/2 yeşil) — `/teachers` ve `/duty-zones` için ayrı Playwright akışı henüz yok.
- Tam paket: 27/27 yeşil.

### Sonraki adım riskleri

1. **Rule Engine yok** (`lib/engine/rules/`) — `teachers`, `duty_zones`, `teacher_unavailable_days` artık dolduruabiliyor ama bunları okuyup atama üreten bir motor henüz yazılmadı (Faz 4 kapsamı) → azaltma: bir sonraki artış Faz 4'e (kural motoru) geçmeli, veri katmanı artık hazır.
2. **Hard delete + cascade riski** yukarıda not edildi → azaltma: gerçek nöbet verisi girilmeden önce silme davranışı gözden geçirilecek.
3. **Branş adı eşleştirmesi serbest metne dayanıyor** (yukarıda not edildi) → azaltma: Rule Engine yazılırken branş karşılaştırması `normalizeTr` ile yapılmalı, tam string eşleşmesine güvenilmemeli.

---

## Faz 2 — Veritabanı Şeması (durum: migration'lar canlıya UYGULANDI — bkz. Faz 3)

### Tamamlanan

1. 7 yeni migration dosyası yazıldı (`supabase/migrations/0003`–`0009`),
   toplam 8 yeni tablo + `schools` tablosuna 3 yeni sütun:
   - `0003_school_profile.sql` — `schools.school_type`, `education_shift`, `profile` (jsonb)
   - `0004_teachers_and_zones.sql` — `teachers`, `duty_zones`
   - `0005_time_model.sql` — `calendar_days`, `time_slots` (ikili öğretim burada çözülüyor)
   - `0006_availability_and_closures.sql` — `teacher_unavailable_days`, `zone_closures`
   - `0007_rule_and_rotation_engine.sql` — `rules`, `rotations`
   - `0008_exceptions.sql` — `exceptions` (rapor/izin/görevlendirme/muafiyet/takas)
   - `0009_duty_assignments.sql` — `duty_assignments`
   Hepsinde `school_id = current_school_id()` deseniyle RLS var, `authenticated`
   rolüne CRUD grant'i var — mevcut `staff`/`locations`/`settings`/`holidays`
   tablolarındaki desenle birebir tutarlı.
2. `staff`/`locations` tablolarına dokunulmadı — eski panel hâlâ onları
   kullanıyor. Yeni tablolar (`teachers`, `duty_zones`) CLAUDE.md ortak diline
   uygun, Faz 4-5 motorlarının okuyacağı kanonik tablolar; eski panel Faz 3'te
   yeni sihirbaz tabanlı panelle değişince `staff`/`locations` kaldırılacak.
3. `tests/db/tenant-isolation.test.js` yardımcı kurulum kodu
   `tests/db/helpers.js`'e çıkarıldı (tekrar önlendi), yeniden çalıştırıldı — 5/5 yeşil.
4. `tests/db/tenant-isolation-phase2.test.js` yazıldı: yeni 8 tablonun her biri
   için "B okulunun satırını A okuyamaz" testi (`it.each`). **Migration'lar
   canlıya henüz uygulanmadığı için bu test şu an kasıtlı olarak KIRMIZI**
   (`relation "public.teachers" does not exist` — beklenen hata, aşağıya bakın).

### ⚠️ Kullanıcı eylemi gerekli — migration'ları uygula

Elimde migration'ları otomatik uygulayacak bir yetkim yok (anon key DDL
çalıştıramaz, service_role/DB şifresi/supabase CLI bağlantısı yok). Faz 1'de
belirlenen desene uyarak: `supabase/migrations/0003_school_profile.sql`'den
`0009_duty_assignments.sql`'e kadar dosyaları **sırasıyla** Supabase Dashboard
→ SQL Editor'de çalıştırman gerekiyor (0001/0002 nasıl çalıştırıldıysa aynı
şekilde). Uyguladıktan sonra haber ver, `tests/db/tenant-isolation-phase2.test.js`'i
çalıştırıp RLS'in yeni tablolarda da doğru kurulduğunu kanıtlayacağım —
Faz 2 ancak o test yeşil olunca "bitti" sayılacak (CLAUDE.md: "kırmızı test
varken faz bitti sayılmaz").

Bu arada Faz 1'dekine ek olarak yine "ZZZ_TENANT_TEST_" önekli 2 yeni geçici
kullanıcı/okul daha oluştu (helper testleri tekrar çalıştırıldığı için) —
temizlik listesi Faz 2 sonunda tek seferde güncellenecek.

### Bilinçli kararlar / teknik borç

- **`exception_type` enum'ında tıbbi kategori yok.** Erken tasarımda
  `dogum_izni` gibi bir kategori düşünülmüştü; KVKK notuna uyarak bunun yerine
  genel `muafiyet` kategorisi kullanıldı — tıbbi gerekçe hiçbir yerde
  saklanmıyor, sadece tarih aralığı.
- **`teacher_unavailable_days` adı bilinçli olarak "available" değil
  "unavailable"** — hard rule handler adıyla (`unavailable_days`) tutarlı
  olsun ve "kayıt yoksa müsaittir" varsayımı isimden belli olsun diye.
- **`duty_assignments` üzerinde `unique(teacher_id, duty_date, slot_key)`**
  var ama `zone_id`'ye göre bir unique kısıt yok — `required_count > 1` olan
  bölgelerde aynı zone/tarih/slota birden fazla öğretmen atanabilmesi
  gerektiği için bilinçli olarak eklenmedi.
- **`current_school_id()` fonksiyonunun gerçek tanımı hâlâ bilinmiyor**
  (Faz 1'den taşınan risk) — yeni RLS politikaları onu çağırıyor ama içeriğini
  doğrulayamadık; taban şema dosyası gelince kontrol edilecek.

### Test kapsamı

- `lib/engine/`: değişmedi (3/3 yeşil).
- `lib/db`/RLS: taban şema 5/5 yeşil; Faz 2 tabloları 11 test yazıldı,
  migration'lar uygulanana kadar kırmızı (beklenen).
- e2e: değişmedi (2/2 yeşil).

### Sonraki faz (Faz 3 — Panel + Sihirbaz) riskleri

1. **Migration'lar uygulanmadan Faz 3'e geçilirse** yeni panel/sihirbaz kodu
   var olmayan tablolara yazmaya çalışır → azaltma: Faz 3 başlamadan önce
   `tenant-isolation-phase2` testinin yeşil olması şart koşulacak.
2. **`teachers`/`staff` ikiliği kullanıcı arayüzünde kafa karışıklığı
   yaratabilir** (iki ayrı "öğretmen listesi" var izlenimi) → azaltma: Faz 3
   sihirbazı sadece `teachers`'ı kullanacak, eski `staff` ekranına hiç link
   verilmeyecek.
3. **`profile` jsonb alanının şekli henüz sabitlenmedi** (floor_count,
   pansiyon vb. anahtar isimleri kodda değil sadece bu raporda tanımlı) →
   azaltma: Faz 3 sihirbazı yazılırken bu anahtarlar `lib/db/schools.js`
   içinde tek bir yerde sabitlenecek, dağınık string literal kullanılmayacak.

---

## Faz 1 — İskelet Denetimi

### Mevcut durum (denetim bulguları)

- **Auth akışı**: Supabase Auth, e-posta + şifre. `signup` → `auth.signUp()` sonra
  `register_school` RPC'si (SECURITY DEFINER — kullanıcı kendini var olan bir okula
  ekleyemiyor, yeni okul + kendisini admin olarak bağlıyor). `login` →
  `signInWithPassword()`. Çalışıyor, test edildi.
- **Middleware**: Sadece `/dashboard/:path*` korunuyor (`middleware.js`). Route
  group'lara taşıma URL'leri değiştirmedi, koruma aynen çalışıyor (e2e ile doğrulandı).
- **RLS**: `staff`, `locations`, `holidays`, `settings` tablolarında RLS var ve
  `current_school_id()` üzerinden okula bağlı (`supabase/migrations/0002_*.sql`).
  `schools` ve `school_users` tablolarında da RLS **canlı projede aktif ve doğru
  çalışıyor** — bunu gerçek bir tenant izolasyon testiyle kanıtladık (aşağıya bakın).
- **Migration dosyaları — KRİTİK BULGU**: `schools`, `school_users` tablolarını ve
  `current_school_id()` fonksiyonunu oluşturan taban şema repo'da hiç yok; README'ye
  göre daha önce doğrudan Supabase Dashboard'dan elle çalıştırılmış. Yani canlı
  veritabanı şu an repo'daki migration dosyalarından tam olarak yeniden
  üretilemez. **Kullanıcı orijinal `schema.sql`'i getirecek**, sonraki adımda
  `0001_base_schema.sql` olarak eklenecek — Faz 1 kapsamında tahmini/uydurma bir
  şema yazılmadı (canlı ile ayrışma riski taşımasın diye).
- **lib/schedule.js** (→ `lib/engine/schedule.js` olarak taşındı) zaten saf bir
  fonksiyon; Supabase/Next.js bilmiyor. Faz 5'in üzerine ineceği zemin hazır.

### Tamamlanan

1. Git deposu başlatıldı (`git init`, `.gitignore`: `node_modules/`, `.next/`,
   `.env.local`), restructure öncesi baseline commit alındı.
2. Klasör yapısı hedefe taşındı (`git mv`, geçmiş korunarak):
   `app/(auth)/{login,signup}`, `app/(panel)/dashboard`, `app/(wizard)` (boş,
   Faz 3'e hazır iskelet), `lib/engine/schedule.js`, `lib/db/` (boş, Faz 2'ye
   hazır), `supabase/migrations/000{1,2}_*.sql`, `tests/{unit,db,e2e}`.
   `next build` ile URL'lerin bozulmadığı doğrulandı (`/`, `/login`, `/signup`,
   `/dashboard` hepsi aynı yollarda üretiliyor).
3. Vitest kuruldu, `lib/engine/schedule.js` için 3 testlik örnek dosya eklendi —
   yeşil.
4. Playwright kuruldu (chromium indirildi), gerçek dev server'a karşı 2 testlik
   auth-redirect senaryosu eklendi — yeşil.
5. Tenant izolasyon testi (`tests/db/tenant-isolation.test.js`) yazıldı ve
   **kullanıcı onayıyla gerçek Supabase projesine karşı çalıştırıldı: 5/5 yeşil.**
   A okulunun kullanıcısı B okulunun `schools`, `school_users` ve `staff`
   satırlarını ne okuyabiliyor ne de B'ye yazabiliyor; kendi okulunu görebiliyor
   (RLS'in her şeyi kapatmadığını da doğrulayan sağlık kontrolü dahil).

### ⚠️ Kullanıcı eylemi gerekli — test verisi temizliği

Test, canlı projede açıkça işaretli 2 geçici kayıt bıraktı (anon key ile
silinemiyor — bkz. Faz 1 sırasında alınan karar):
- Auth kullanıcıları: `zzz-tenant-test-a-*@example.invalid`,
  `zzz-tenant-test-b-*@example.invalid`
- Okullar: `ZZZ_TENANT_TEST_OKUL_A`, `ZZZ_TENANT_TEST_OKUL_B` (+ B'ye bağlı
  `ZZZ_TENANT_TEST_OGRETMEN_B` personel kaydı)

Supabase Dashboard → Authentication ve Table Editor'den elle silinebilir.

### Teknik borç

- **Doğrudan Supabase çağrıları henüz `lib/db/`'ye taşınmadı.**
  `Dashboard.jsx`, `dashboard/actions.js`, `dashboard/page.jsx` hâlâ
  `lib/supabase/{client,server}`'ı doğrudan kullanıyor. Faz 1 kapsamı sadece
  taşımaydı (mevcut işlevi bozmamak için); gerçek geçiş Faz 2'de yeni sorgular
  yazılırken kademeli yapılacak.
- **`mondayOf()` (lib/engine/schedule.js) gizli saat dilimi kırılganlığı.**
  `toISOString()` (UTC) ile yerel saat karışık kullanılıyor; UTC+3 gibi
  dilimlerde döndürülen anahtar takvimsel olarak bir gün geride çıkıyor. Şu an
  yalnızca opak bir gruplama anahtarı olarak tutarlı kullanıldığı için görünür
  bir hataya yol açmıyor (test ile doğrulandı, bkz. `tests/unit/schedule.test.js`)
  ama kırılgan. **Faz 5'te scheduler yeniden ele alınırken `ymdStr` ile aynı
  (yerel) yönteme taşınmalı.**
- **Taban şema migration'ı eksik** (yukarıda kritik bulgu olarak işaretlendi) —
  kullanıcıdan `schema.sql` bekleniyor, gelince `0001_base_schema.sql` eklenecek.

### Test kapsamı

- `lib/engine/`: 3/3 test yeşil (tarih yardımcı fonksiyonları). Henüz
  `generateSchedule`'ın kendisi test edilmedi — kapsam hedefi %90+, Faz 5'te
  scheduler'a el atılırken tamamlanacak.
- `lib/db/`: henüz kod yok (Faz 2). Tenant izolasyonu şu an canlıda 5/5 doğrulandı.
- e2e: 1 akış (giriş yapmamış kullanıcı yönlendirmesi) — 2/2 yeşil.

### Sonraki faz (Faz 2 — Veritabanı) riskleri

1. **Taban şema hâlâ elimizde yok** → Faz 2'nin migration seti bu olmadan
   tamamlanamaz; azaltma: kullanıcıdan dosya gelir gelmez ilk iş olarak eklenip
   canlıyla karşılaştırılacak.
2. **6 çekirdek mekanizma (calendar_days, time_slots, teacher_available_days,
   zone_closures, exceptions) henüz şemaya girmedi** → Faz 5'te algoritma iki kez
   yazılma riski; azaltma: Faz 2 migration'ı bu tabloları ilk günden içerecek.
3. **`current_school_id()` fonksiyonunun tanımı bilinmiyor** (sadece canlıda var,
   koda yansımamış) → Faz 2'de yeni RLS politikaları yazarken yanlış varsayımla
   ilerleme riski; azaltma: taban şema dosyası gelince fonksiyonun gerçek
   tanımı doğrulanacak.

### Değişen / eklenen dosyalar

```
YENİ:
  .gitignore
  CLAUDE.md
  PHASE_REPORT.md
  nobet-app/vitest.config.js
  nobet-app/playwright.config.js
  nobet-app/tests/setup-env.js
  nobet-app/tests/unit/schedule.test.js
  nobet-app/tests/e2e/auth-redirect.spec.js
  nobet-app/tests/db/tenant-isolation.test.js
  nobet-app/lib/db/README.md
  nobet-app/app/(wizard)/README.md

TAŞINDI (git mv, geçmiş korunarak):
  app/login/*            → app/(auth)/login/*
  app/signup/*           → app/(auth)/signup/*
  app/dashboard/*         → app/(panel)/dashboard/*
  lib/schedule.js         → lib/engine/schedule.js
  sql/register_school_function.sql → supabase/migrations/0001_register_school_function.sql
  sql/dashboard_schema.sql         → supabase/migrations/0002_dashboard_schema.sql

DÜZENLENDİ (import yolu güncellemesi, davranış değişmedi):
  app/(panel)/dashboard/Dashboard.jsx  (@/lib/schedule → @/lib/engine/schedule)
  app/(panel)/dashboard/actions.js     (@/lib/schedule → @/lib/engine/schedule)
  package.json                         (test, test:e2e script'leri eklendi)

DEĞİŞMEDİ (fonksiyon/davranış olarak dokunulmadı):
  middleware.js, lib/supabase/client.js, lib/supabase/server.js,
  app/layout.jsx, app/page.jsx, tüm mevcut iş mantığı
```
