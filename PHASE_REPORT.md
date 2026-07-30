# PHASE_REPORT.md

## Faz 8.5 — Süper Admin Paneli (platform sahibinin çapraz-okul yönetim ekranı)

Kullanıcı isteği: özet metrikler (aktif okul sayısı, aylık tahmini ciro, bu hafta kaydolan okul), okul yönetim tablosu (deneme uzatma, manuel abonelik tanımlama, hesap dondurma) ve canlı kullanım (hangi okul ne zaman program üretti).

### Mimari karar — neden yeni bir yetki mekanizması gerekti

Bugüne kadar HER RLS politikası `current_school_id()`'ye göre satır bazlı izole ediyordu — bir okul asla başka bir okulu göremiyordu. Süper admin bunun ilk BİLİNÇLİ istisnası. Geniş bir "RLS bypass" politikası yerine (yanlışlıkla her authenticated kullanıcıya sızma riski taşırdı), `register_school`/`trial_registrations` ile AYNI desen kullanıldı: dar kapsamlı SECURITY DEFINER fonksiyonlar, her biri `platform_is_admin()` kontrolünden geçmeden hiçbir şey yapmaz. Program/component'lar `schools`/`subscriptions` tablolarına çapraz-okul sorgusu ATAMAZ — RLS zaten engeller, tüm çapraz-okul erişimi SADECE bu RPC'ler üzerinden.

### Tamamlanan

1. **`0016_super_admin.sql`** (yeni migration): `platform_admins` tablosu (kimin süper admin olduğu — kimse doğrudan okuyup yazamaz, `trial_registrations` ile aynı desen), `subscriptions.status`'a `'frozen'` eklendi (müşterinin kendi iptali olan `'canceled'`'dan farklı — admin kararıyla durdurma), ve 5 SECURITY DEFINER fonksiyon: `platform_is_admin()`, `platform_list_schools()` (tüm okullar + abonelik + öğretmen sayısı + son program üretim zamanı), `platform_extend_trial(school_id, days)`, `platform_set_subscription(...)` (tam manuel override), `platform_freeze_school(school_id)`.
2. **`lib/engine/platformMetrics.js`** (yeni, saf fonksiyon) — `computePlatformMetrics(schools, now)`: aktif okul sayısı (kullanılabilir abonelik durumuna göre canlı hesaplanır, saklanmaz), bu hafta kaydolan okul sayısı, aylık tahmini ciro (SADECE `status='active'` — gerçekten ödemeli — okullardan, güncel öğretmen sayısına göre `lib/engine/pricing.js` ile aynı kademe mantığıyla). 5 test eklendi.
3. **`lib/engine/subscription.js`**: `'frozen'` durumu için "Dondurulmuş (Yönetici)" etiketi + `isUsable: false` eklendi — dondurulmuş bir okul artık normal panelinde de (mevcut `requireUsableSubscription` zinciri üzerinden) program oluşturamaz, ekstra kod gerekmedi.
4. **`app/super-admin/`** (yeni route, `(wizard)`/`(auth)`/`(marketing)` gruplarının dışında — okula bağlı olmak bu sayfa için önemsiz): `page.jsx` (auth + `platform_is_admin` kontrolü, admin değilse `/dashboard`'a yönlendirir — RPC bulunamazsa/hata verirse de GÜVENLİ TARAFTA kalıp erişimi reddeder), `SuperAdminPanel.jsx` (özet kartları, "Canlı Kullanım" listesi, okul tablosu + Deneme Uzat/Abonelik Düzenle/Dondur aksiyonları), `actions.js`. Mevcut `dashboard.css` yeniden kullanıldı (`.dash-root` kapsamlı genel `.card`/`.btn`/`.stat-card` sınıfları) — yeni bir stil dosyası yazılmadı.
5. **`middleware.js`**: `/super-admin` de `/dashboard` gibi girişsiz erişime kapatıldı (derin "gerçekten admin mi" kontrolü sayfa seviyesinde).

### Bulunan ve düzeltilen hata

İlk halinde `page.jsx`, `isPlatformAdmin()` RPC'sinin fırlattığı hatayı (migration henüz uygulanmadığı için "function not found") YAKALAMIYORDU — bu da sayfayı çökertiyordu (admin olmayan biri için sessizce `/dashboard`'a yönlendirmek yerine). `try/catch` eklenip hata durumunda "admin değil" varsayılacak şekilde düzeltildi — bir admin panelinde hataya karşı doğru varsayılan her zaman ERİŞİMİ REDDETMEK, sessizce izin vermek değil.

### Kullanıcının yapması gerekenler

1. **`0016_super_admin.sql`** migration'ını Supabase SQL Editor'de çalıştır (0012-0015'ten sonra, sırayla).
2. **Kendini süper admin yap** — migration'dan SONRA, SQL Editor'de kendi hesabının e-postasını kullanarak:
   ```sql
   insert into platform_admins (user_id)
   select id from auth.users where email = 'SENİN_EMAIL_ADRESİN';
   ```
3. Bundan sonra `/super-admin` adresine giriş yaptığın hesapla girebilirsin.

### Test kapsamı

`tests/unit/platformMetrics.test.js` (yeni, 5 test) + `tests/unit/subscription.test.js`'e 1 test eklendi (`'frozen'` durumu). `vitest run tests/unit` 93/93 yeşil. Tam build başarıyla derlendi (`/super-admin` route 3.78kB, `ƒ` dinamik). Canlı ortamda: migration henüz uygulanmadığı için admin kontrolü beklenen şekilde başarısız oldu ve düzgünce `/dashboard`'a yönlendirdi (çökme yok) — asıl panel arayüzü (metrik kartları, okul tablosu, aksiyonlar) migration uygulanana kadar canlıda uçtan uca test edilemedi.

---

## Faz 8.4 — Yer kısıtı (yeni hard rule), personel paneli sadeleştirme, dönme düzeni açıklamaları, müdür yardımcısı

Kullanıcı dört ayrı istek getirdi: (1) çalışmayan "Müsaitlik" ve kafa karıştıran "Pasifleştir" butonları kaldırılsın, yerine her öğretmende ayrı "Gün Kısıtı" ve "Yer Kısıtı" butonları olsun (ikisi birlikte işaretlenirse öğretmen hem o güne hem o yere sabitlensin); (2) Dağıtım Ayarları'ndaki 3 dönme düzeni örneklerle açıklansın; (3) "Lokasyonlar" → "Nöbet Yerleri"; (4) resmi çizelgede müdür yardımcısının adı da yazacağı için o bilgi de toplansın.

### Tamamlanan

1. **Yeni hard rule: `teacher_zone_restriction`** — bir öğretmen artık tek bir nöbet yerine sabitlenebilir (`teachers.fixed_zone_id`, yeni migration `0015_teacher_fixed_zone.sql`). Saf fonksiyon [`lib/engine/rules/teacherZoneRestriction.js`](nobet-app/lib/engine/rules/teacherZoneRestriction.js), `checkHardRules` listesine eklendi, `rules` tablosunda aç/kapa edilebilir (diğer hard rule'larla aynı desen). 1 geçer + 1 eler + 1 "kısıt yok" testi eklendi (`tests/unit/rules/teacherZoneRestriction.test.js`).
2. **`lib/db/bulkSchedule.js`**: kısıtlı/kısıtsız öğretmen ayrımı genişletildi — `restriction_mode !== 'ALL'` VEYA `fixed_zone_id` doluysa öğretmen artık haftalik_yer desenine (gride) hiç katılmıyor, Faz 0'da (mevcut gün-kısıtlı önceliklendirme mekanizması) öncelikli deneniyor. Yer kısıtlı bir öğretmen Faz 0'da TÜM bölgeler için aday gösteriliyor ama yeni rule onu kendi sabit bölgesi dışındaki her bölgede eliyor — bulkSchedule.js'e bölgeye özel ekstra filtreleme kodu YAZILMADI, var olan checkHardRules mekanizması zaten yeterli (minimum diff, mevcut mimariye tam uyum).
3. **Personel paneli**: "Müsaitlik" (bozuktu — ALL modundaki bir öğretmende sadece "Bu öğretmende gün kısıtı yok" yazan, kısıt TÜRÜNÜ değiştiremeyen bir panel açıyordu) ve "Pasifleştir" butonları kaldırıldı. Yerine her öğretmende **"Gün Kısıtı"** (artık kısıt türünü VE günleri aynı panelden değiştirebiliyor — eski bug düzeldi) ve **"Yer Kısıtı"** (yeni, sabit nöbet yeri seçimi) butonları eklendi. Sabit yeri olan öğretmenler listede 📍 rozetiyle gösteriliyor. Yeni öğretmen ekleme formuna da bir "Yer Kısıtı" seçimi eklendi.
4. **Dağıtım Ayarları açıklamaları**: seçilen döngüye göre değişen, kullanıcının kendi tarifiyle yazılmış somut örnekli bir açıklama kutusu eklendi (`ROTATION_MODE_DESCRIPTIONS`) — üç modun da nasıl işlediği artık bir örnek üzerinden anlatılıyor.
5. **"Lokasyonlar" → "Nöbet Yerleri"** — başlık ve istatistik etiketi (kod içindeki `zones`/`duty_zones` isimlendirmesi değişmedi, sadece kullanıcıya görünen metin).
6. **Müdür Yardımcısı adı** — okul müdürü adıyla aynı desen (`schools.profile` jsonb, bkz. Faz 8.3), Okul Bilgileri kartına ikinci bir alan olarak eklendi. `lib/db/schoolContext.js`'teki `updateSchoolPrincipal` artık genel bir `updateSchoolProfileFields(supabase, schoolId, patch)` fonksiyonuna dönüştürüldü (iki somut kullanım ortaya çıktığı için genelleştirme haklıydı — bkz. CLAUDE.md sadelik kuralları). Resmi Word çıktısındaki tek imza bloğu, ikisi de otomatik dolan iki imza bloğuna çevrildi: sol "Müdür Yardımcısı", sağ "Okul Müdürü".

### Kullanıcının yapması gereken

**`0015_teacher_fixed_zone.sql`** migration'ını Supabase SQL Editor'de çalıştır (0012/0013/0014 gibi, sırayla) — canlıda test edilirken bu olmadan "Yer Kısıtı" kaydedilmeye çalışılınca beklenen hata alındı: *"Could not find the 'fixed_zone_id' column of 'teachers' in the schema cache"*. Migration uygulanmadan bu özellik kullanılamaz.

### Test kapsamı

`tests/unit/rules/teacherZoneRestriction.test.js` (yeni, 3 test) + `vitest run tests/unit` 87/87 yeşil. Tam build başarıyla derlendi. Personel panelindeki yeni "Gün Kısıtı"/"Yer Kısıtı" butonları, dönme düzeni açıklama kutusunun seçime göre değişmesi, "Nöbet Yerleri" başlığı ve Müdür Yardımcısı alanı canlı ortamda uçtan uca doğrulandı (Yer Kısıtı kaydetme, migration eksikliğinden beklenen hatayı — çökmeden, düzgün bir toast ile — verdi).

---

## Faz 8.3 — Resmi nöbet çizelgesi: MEB tarzı düzenlenebilir Word belgesi

Kullanıcı örnek bir belge (EK1: "ÖĞRETMEN NÖBET ÇİZELGESİ") paylaştı — yazdırma çıktısının bu şablona (bölge=satır, gün=sütun, nöbetçi öğretmen görevleri listesi, imza bloğu) uygun, Times New Roman 12 punto, okul müdürü adı otomatik dolu ve **düzenlenebilir** bir Word belgesi olmasını istedi.

### Tamamlanan

1. **`exportHTML()` (Dashboard.jsx) tamamen yeniden yazıldı** — eski çıktı tarih-satır/bölge-sütun'du ve tarayıcı yazdırma diyaloğunu açıyordu; yeni çıktı örnek belgeyle birebir aynı yerleşimde (NÖBET YERİ satır, haftanın günü sütun), her hafta ayrı bir tablo + geçerlilik tarihi satırı, sabit "Nöbetçi Öğretmenin Görevleri" 8 maddelik liste ve sağ altta imza bloğu içeriyor. Times New Roman 12pt.
2. **Gerçek `.doc` dosyası indiriliyor** (`application/msword` MIME + Word XML namespace'leri) — artık tarayıcı yazdırma penceresi açmıyor, Word'ün doğrudan açıp TAM DÜZENLEYEBİLECEĞİ bir dosya iniyor (ayrı bir docx kütüphanesi gerekmedi — Word, iyi biçimlendirilmiş HTML'i native olarak okur, bu yaygın ve güvenilir bir teknik).
3. **Okul müdürü adı** artık Ayarlar sekmesinde ayrı bir alan (🏫 Okul Bilgileri kartı) — girilen isim, mevcut `schools.profile` jsonb sütununda saklanıyor (0003'te tam bu amaçla tasarlanmış esnek alan, yeni sütun/migration gerekmedi) ve çıktıdaki imza bloğuna otomatik yazılıyor; boşsa imza satırı boş bırakılıyor (elle imzalanabilir).

### Bulunan ve düzeltilen hata

Canlı ortamda test edilirken müdür adı alanı kaydedilince **"permission denied for table schools"** hatası bulundu — 0011 migration'ı `schools` tablosunda UPDATE'i BİLEREK sadece `rotation_mode` sütununa açmıştı ("okul adı/il/ilçe hâlâ istemciden değiştirilemez" kararı). `profile` sütununa yazma izni yoktu. **`0014_school_principal_grant.sql`** eklendi (`grant update (profile) on public.schools to authenticated`) — satır bazlı RLS politikası zaten 0011'de vardı, sadece sütun izni eksikti.

### Kullanıcının yapması gereken

**`0014_school_principal_grant.sql`** migration'ını Supabase SQL Editor'de çalıştır (0012/0013 gibi) — bu olmadan "Okul Müdürü Adı Soyadı" alanı kaydedilemez, aynı "permission denied" hatasını almaya devam edersin.

### Test kapsamı

UI/export değişikliği; motor/DB testlerinde değişiklik yok, `vitest run tests/unit` 84/84 yeşil, tam build başarıyla derlendi. Müdür adı alanının canlı ortamda kayıt akışı uçtan uca denendi (yukarıdaki permission hatası bu sırada bulundu). Word belge çıktısının kendisi, kullanıcının canlı okul verisini bozabilecek bir program yeniden-üretimi gerektirdiğinden bu turda tarayıcıda ayrıca tetiklenmedi — kod, mevcut `table`/`weeks` veri yapılarını (CSV export'un zaten kullandığı) aynı şekilde tükettiği için üretim derlemesi (`next build`) üzerinden sözdizimi/tip doğrulaması yapıldı.

---

## Faz 8.2 — Okul adı: MEB'den canlı çekilen gerçek il/ilçe/okul kaskadı

Kullanıcı isteği: okul adı serbest metin yerine seçmeli olsun; önce il, sonra o ile bağlı ilçe, sonra o ilçedeki gerçek okul seçilsin; ilkokul/ortaokul/ortaöğretim/lise/fen lisesi dahil tüm okul tipleri listede olsun; ayrıca "Diğer" ve "(Özel Okul)" seçenekleri de bulunsun.

### Tamamlanan

1. **MEB'in canlı okul arama servisi** (`meb.gov.tr/baglantilar/okullar/okullar_ajax.php`) araştırıldı ve doğrulandı — tek istekle bir ilin TÜM okullarını (en büyüğü İstanbul: 3495 kayıt) döndürüyor. 81 il için tek seferlik bir toplama scriptiyle **55.005 okul/kurum** çekildi (uydurma/statik bir liste değil, MEB'in kendi güncel verisi).
2. **Okul tipi sınıflandırması** isimden regex ile çıkarıldı (ilkokul, ortaokul, imam hatip ortaokulu, lise, anadolu lisesi, fen lisesi, sosyal bilimler lisesi, imam hatip lisesi, mesleki/teknik lise, güzel sanatlar lisesi, spor lisesi, anaokulu, özel eğitim, halk eğitimi, diğer kurum) — Türkçe büyük "İ" harfinin JS regex'in `/i` bayrağıyla eşleşmediği bir hata bulunup düzeltildi (`toLocaleLowerCase('tr')` ile normalize edilerek).
3. **Veri iki dosyaya ayrıldı**: `lib/data/mebProvinces.json` + `mebProvinceDistricts.js` (küçük, il/ilçe listesi — signup sayfası client bileşenine güvenle import edilir) ve `lib/data/mebSchools.json` + `mebSchoolLookup.js` (büyük, ~3MB okul listesi — SADECE `signup/actions.js` server action'ı içinden okunur, client bundle'ına asla dahil olmaz).
4. **Kayıt formu üçüncü bir kaskad seviyesi kazandı**: İl → İlçe → Okul. Okul seçilince gerçek MEB verisiyle o ilçedeki tüm okullar (tipi parantez içinde) listelenir; listede "(Özel Okul) — listede yok, kendim yazacağım" ve "Diğer — okulumu listede bulamadım" seçenekleri seçilince serbest metin alanı açılır.
5. Artık kullanılmayan elle yazılmış `lib/data/turkeyProvinces.js` (81 il, 972 ilçe, statik/tahmini) silindi — ilçe listesi artık MEB'in gerçek verisinden türetildiği için okul listesiyle birebir tutarlı.

### Teknik borç / bilinen sınırlamalar

- MEB verisinde ~30 kayıtlık küçük tutarsızlık bulundu (ör. birkaç eski kayıt "Afyon" ismini kullanıyor, güncel adı "Afyonkarahisar" ile birleştirildi) — geri kalan "Büyükşehir" gibi nadir sözde-ilçe etiketleri (öğretmenevi vb. idari kurumlar, nöbet tutan sınıf öğretmeni olmayan kurumlar) dokunulmadan bırakıldı, kullanıcı deneyimini etkilemiyor.
- Veri statik bir dosya olarak derlendi (canlı API her kayıt formunda çağrılmıyor) — MEB yeni okul açtıkça/kapattıkça veri güncel kalmaz. İleride bir yenileme scripti (bu script'in aynısı tekrar çalıştırılır) periyodik olarak koşturulabilir; şu an için YAGNI.

### Test kapsamı

Bu tur veri/UI; motor veya DB testlerinde değişiklik yok, `vitest run tests/unit` 84/84 yeşil. Kaskad (il→ilçe→okul, gerçek MEB verisiyle Kırıkkale örneği) ve "Diğer" seçilince serbest metin alanının açılması tarayıcıda uçtan uca doğrulandı.

---

## Faz 8.1 — Kayıt formu iyileştirmeleri + giriş/kayıt tasarımı

Kullanıcı Resend+Supabase e-posta kod entegrasyonunun çalışmadığını bildirdi (kod gelmiyor — bu bir HESAP/AYAR sorunu, kodda düzeltilecek bir şey yok, aşağıda kontrol listesi var). Ayrıca üç somut istek: telefon alanına sadece rakam girilebilsin, İl/İlçe seçmeli (81 il + gerçek ilçeler) olsun, giriş/kayıt sayfaları profesyonel bir SaaS görünümüne kavuşsun.

### Tamamlanan

1. **`lib/data/turkeyProvinces.js`** (yeni, saf veri) — Türkiye'nin 81 ili + 972 ilçesi. Kayıt formunda İl seçilince İlçe listesi o ile göre otomatik güncelleniyor (İl değişince eski İlçe seçimi sıfırlanır, geçersiz kombinasyon oluşmaz).
2. **Telefon alanı artık sadece rakam kabul ediyor** — yapıştırma/harf/özel karakter girişi anında temizleniyor (`0(555) abc-12` → `05551234567` gibi), en fazla 11 haneyle sınırlı.
3. **Giriş/Kayıt sayfaları yeniden tasarlandı** (`app/(auth)/auth.css`, yeni) — düz HTML görünümünden, tanıtım sitesiyle aynı koyu tema/yazı tipini (Bebas Neue başlık + DM Sans gövde) paylaşan, ortalanmış kart tasarımına geçildi. Kayıt formunda İl/İlçe artık iki sütunlu bir satırda, e-posta onay kodu adımı ayrı ve belirgin bir "bilgi kutusu" içinde gösteriliyor.

### Kullanıcının kontrol etmesi gerekenler (Resend + Supabase e-posta sorunu)

Kodlar gelmiyorsa şu sırayla kontrol et (en sık nedenden başlayarak):

1. **Resend'de domain doğrulaması yapılmış mı?** Resend, doğrulanmamış bir domain'den e-posta göndermeye izin vermez (sadece hesap sahibinin kendi e-postasına test gönderimi çalışır). Resend Dashboard → Domains → domain'in yanında "Verified" yazmalı; değilse DNS'e SPF/DKIM kayıtlarını eklemen gerekiyor.
2. **Supabase'de "Enable Custom SMTP" gerçekten açık mı?** Project Settings → Authentication → SMTP Settings — bu ayrı bir anahtar, sadece "Confirm email"i açmak yetmez. Host: `smtp.resend.com`, Port: `465` (SSL) veya `587` (TLS), Username: `resend` (harfiyen bu), Password: Resend API anahtarın (`re_` ile başlar).
3. **"Sender email" alanı, Resend'de doğrulanmış domain ile aynı mı?** Örn. Resend'de `okulnobet.com` doğrulandıysa, gönderen adres `noreply@okulnobet.com` gibi AYNI domain'den olmalı — farklı bir domain yazarsan gönderim reddedilir.
4. **E-posta şablonu `{{ .Token }}` içeriyor mu?** Authentication → Email Templates → "Confirm signup" — Supabase'in varsayılan şablonu sadece link (`{{ .ConfirmationURL }}`) gönderir; kod (`{{ .Token }}`) GÖRÜNMÜYORSA e-posta gelse bile içinde kod olmaz.
5. **Resend Dashboard → Logs'a bak.** Supabase gönderim isteğini Resend'e gerçekten iletmiş mi, iletilmişse ne olmuş (delivered/bounced/failed) — en net teşhis burada.
6. **Supabase Dashboard → Authentication → Logs'a bak.** signUp çağrısı sırasında SMTP hatası varsa burada görünür (`supabase.auth.signUp()` e-posta gönderimi başarısız olsa bile genelde HATA DÖNDÜRMEZ — kullanıcı oluşur ama e-posta sessizce gitmemiş olabilir, bu yanıltıcı bir davranış).

Bunları kontrol edip hâlâ sorun varsa, Resend Logs'ta veya Supabase Auth Logs'ta gördüğün TAM hata mesajını paylaş — kod tarafında yapılacak bir şey varsa (örn. yanlış çağrı şekli) oradan teşhis ederim.

### Test kapsamı

Bu tur tamamen UI/veri; ilgili DB/motor testlerinde değişiklik yok. Tam paket build başarıyla derlendi, yeni sayfalar (giriş, kayıt — İl/İlçe kaskadı ve telefon filtresi dahil) tarayıcıda uçtan uca doğrulandı.

---

## Faz 8 — Ticari SaaS'a geçiş: performans + fiyatlandırma + deneme kısıtları + tanıtım sitesi

Kullanıcı 4 madde istedi: (1) öğretmen silme 4-5 saniye sürüyor; (2) öğretmen sayısına göre kademeli fiyatlandırma + profesyonel bir SaaS sitesi (Hakkımızda/SSS/Misyon-Vizyon/Gizlilik/3D Secure); (3) deneme sürecinde e-posta+telefon başına tek deneme, e-posta onay kodu; (4) siteyi canlıya alıp linkini paylaşmak istiyor. Madde 2 ve 4'ün bazı parçaları (gerçek ödeme sağlayıcı hesabı, gerçek şirket/yasal bilgisi, hosting/domain) SADECE kullanıcının yapabileceği iş/hukuki kararlar olduğu için önce netleştirildi (bkz. aşağıdaki "Kullanıcının yapması gerekenler").

### Tamamlanan

1. **Performans — eksik index'ler bulundu.** `teachers`, `duty_zones`, `duty_assignments`, `zone_closures`, `exceptions` ve (taban şemada repo dışında kurulmuş) `school_users` tablolarında `school_id`/`teacher_id`/`zone_id` üzerinde HİÇ index yoktu (Postgres foreign key'leri otomatik indexlemez) — her RLS kontrolü ve öğretmen silmedeki cascade taraması sequential scan'e düşüyordu. `0012_performans_indexes.sql`: tüm eksik index'ler eklendi (`CREATE INDEX IF NOT EXISTS`, veri değişikliği yok, güvenli).
2. **Kademeli fiyatlandırma — canlı hesaplanan, saklanmayan bir kademe.** `lib/engine/pricing.js` (saf): 0-20/21-40/41-60/61+ öğretmen kademeleri, aylık+yıllık TL fiyatları. Kademe DB'ye YAZILMIYOR — okulun GÜNCEL öğretmen sayısına göre her seferinde hesaplanıyor (aksi halde öğretmen sayısı değiştikçe bayatlardı). `Hesabım` sekmesine güncel kademe + iki fiyat gösterimi eklendi.
3. **Deneme kısıtları.** `0013_pricing_and_trial_limits.sql`: yeni `trial_registrations` tablosu (email+phone, UNIQUE, okul silinse bile KALICI durur) — `register_school` artık `p_phone` alıyor ve bu tabloyu kontrol ederek aynı e-posta/telefonla ikinci bir deneme açılmasını engelliyor. Ayrıca `lib/engine/subscription.js`'e `checkTrialDateRangeAllowed` eklendi: deneme durumundaki bir okul tek "Program Oluştur" çağrısında en fazla ~31 gün üretebilir (`requireUsableSubscription` artık bunu da uyguluyor).
4. **E-posta onay kodu.** Kayıt akışı iki aşamalıya çevrildi (`app/(auth)/signup/`): (1) bilgiler + telefon toplanır, `auth.signUp()` çağrılır; (2) e-postaya giden 6 haneli kod girilir (`auth.verifyOtp(type:'signup')`), doğrulanınca `register_school` çağrılır. Okul, kod doğrulanmadan OLUŞTURULMAZ. "Kodu tekrar gönder" butonu eklendi.
5. **Profesyonel tanıtım sitesi.** Yeni `app/(marketing)/` route group + paylaşılan header/footer: `/fiyatlandirma` (aylık/yıllık geçişli, 4 kademe), `/hakkimizda` (misyon+vizyon dahil), `/sss`, `/gizlilik` (KVKK maddeleri), `/kullanim-sartlari`, `/odeme-guvenligi` (3D Secure/PCI-DSS açıklaması). Kök `/` artık gerçek bir açılış sayfası (giriş yapmamışsa) — giriş yapmışsa öncekiyle aynı şekilde `/dashboard`'a yönlendiriyor. Gerçek şirket/yasal bilgi gerektiren yerler kullanıcının tercihiyle `[DOLDURULACAK: ...]` şeklinde AÇIKÇA işaretlendi — yayına almadan önce doldurulmalı.

### Kullanıcının yapması gerekenler (ben yapamam)

- **Migrasyonları uygula:** `0012_performance_indexes.sql` ve `0013_pricing_and_trial_limits.sql` henüz CANLI Supabase projesine uygulanmadı (DB kimlik bilgim yok) — Supabase Dashboard → SQL Editor'e yapıştırıp çalıştırman gerekiyor. Uygulanana kadar kayıt/öğretmen silme gibi işlemler `register_school` hata verir (test ettim, tam olarak bu hatayı alıyorsun: "Could not find the function... p_phone").
- **Supabase Auth ayarı:** Authentication → Providers → Email → "Confirm email" AÇILMALI; Authentication → Email Templates → "Confirm signup" şablonunda `{{ .Token }}` (6 haneli kod) kullanılmalı — Supabase'in varsayılan şablonu link gönderir, kod değil. Bu AÇILMADAN yeni kayıt akışı e-posta göndermez.
- **Ödeme sağlayıcı:** PayTR/iyzico'da henüz hesabın yok (senin tercihin) — API entegrasyonu bu turun kapsamı dışında bırakıldı, hesap açılınca haber ver.
- **Yasal içerik:** Hakkımızda/Gizlilik/Kullanım Şartları/SSS'teki `[DOLDURULACAK]` alanları (şirket unvanı, adres, iletişim e-postası) gerçek bilgilerle doldurulmalı — KVKK gereği sahte/yer tutucu bilgiyle yayına alınmamalı.
- **Hosting + domain:** Şu an yok (kullanıcı onayıyla) — Vercel (ücretsiz, Next.js için önerilir) + bir domain sağlayıcıdan alan adı satın alınması gerekiyor; bu bir finansal işlem olduğu için benim tarafımdan yapılamaz.

### Test kapsamı

- Yeni birim testler: `pricing.test.js` (6/6, tüm kademe sınırları), `subscription.test.js`'e `checkTrialDateRangeAllowed` testleri eklendi (4 yeni). Saf motor testleri (DB gerektirmeyen) tam paket: 84/84 yeşil.
- DB testleri ŞU AN kırık (yukarıdaki migrasyon uygulanmadığı için, kodda değil) — `tests/db/helpers.js` yeni `p_phone` parametresini zaten gönderiyor, migrasyon uygulanınca tekrar yeşile dönmesi bekleniyor.
- Tarayıcıda uçtan uca doğrulandı: `/`, `/fiyatlandirma` (aylık↔yıllık geçiş), `/hakkimizda`, `/sss`, `/gizlilik`, `/kullanim-sartlari`, `/odeme-guvenligi` sayfaları hatasız render oldu; giriş yapmış kullanıcı `/`'ye gidince `/dashboard`'a yönlendirildi; Hesabım sekmesinde güncel öğretmen sayısına göre doğru kademe/fiyat gösterildi; yeni kayıt formunda telefon alanı görünüyor.

### Sonraki adım riskleri

1. **register_school'un imzası değişti** — eski 3 parametreli sürüm migrasyonda DROP edildi; migrasyon uygulanana kadar (ve production'da eski istemci kodu cache'lenmişse geçiş anında) kayıt olma çalışmaz. Kısa bir bakım penceresi gibi düşünülmeli.
2. **DB testleri şu an "Confirm email" KAPALI varsayımıyla çalışıyor** (bkz. tests/db/helpers.js'in mevcut immediate-session mantığı) — kullanıcı "Confirm email"i AÇARSA, bu test paketi muhtemelen kırılır (signUp artık session döndürmez). O noktada ayrı bir test stratejisi (örn. service-role ile önceden onaylanmış test kullanıcıları) gerekecek.
3. **Ödeme entegrasyonu tamamen kapsam dışı** — Hesabım'daki "satın al" akışı şu an sadece bilgilendirme; gerçek bir "satın al" butonu, sağlayıcı seçilip API bilgileri verilince ayrı bir turda eklenmeli.

---

## Faz 7.5 — Gün kısıtlı öğretmen hatası + kıtlık önizlemesi + arayüz temizliği

Kullanıcı 4 ayrı konu bildirdi: (1) "sadece çarşamba" gibi gün kısıtlı bir öğretmen her hafta o günü almıyordu; (2) Öğretmen formundaki "Kapasite" alanının ne işe yaradığı belirsizdi; (3) Bölge formundaki "Öncelik" alanının rotasyonu nasıl etkilediği belirsizdi; (4) öğretmen sayısı yetersiz olduğunda hangi yer/günün boş kalacağının PROGRAM OLUŞTURMADAN ÖNCE sorulması istendi.

### Tamamlanan

1. **Gün kısıtlı öğretmen hatası — gerçek kök neden bulundu.** `haftalik_yer`'in gün-öncelikli tek döngüsü TÜM öğretmenleri aynı şekilde ilerletiyor: bir öğretmen desene (grid) katılırsa, bölge listesi bitince günü de değişiyor. Sadece Çarşamba çalışabilen bir öğretmen desene katılırsa, döngü onu er ya da geç MÜSAİT OLMADIĞI bir güne kaydırıyordu — orada kalıcı olarak elenip döngü tekrar Çarşamba'ya gelene kadar (haftalarca) hiç atanamıyordu. **Düzeltme (`lib/db/bulkSchedule.js`):** Gün kısıtlı öğretmenler (`restriction_mode !== 'ALL'`) artık ASLA desene katılmıyor (Faz B'nin "desene katıl" mantığından ve çapa/geriye-bakış yeniden inşasından hariç tutuldular). Bunun yerine yeni bir **Faz 0** eklendi: her hafta, normal desenden (Faz A) ÖNCE, gün kısıtlı öğretmenler kendi müsait oldukları günde ÖNCELİKLİ olarak denenir (aralarında adillikle). Böylece "tek gün çalışabilen" biri o günün kıt alternatiflerinden biri olduğu için neredeyse her zaman seçilir, ve deseni asla bozmaz.
2. **Kıtlık önizlemesi — "Program Oluştur"dan ÖNCE sor.** `generateBulkSchedule`'a `dryRun` parametresi eklendi: DB'ye hiç yazma/silme yapmadan aynı motoru çalıştırıp hangi (gün, bölge) hücrelerinin öğretmen yetersizliğinden BOŞ kalacağını (`emptySlots`) döner. Yeni `previewBulkSchedule` server action'ı bunu çağırır. `Dashboard.jsx`'teki "Program Oluştur" akışı artık ÖNCE bu önizlemeyi çalıştırıyor; boş kalacak yer varsa mevcut onay penceresine ("bu aralık silinip yeniden üretilecek") bunların tam listesi (tarih, gün, bölge, eksik kişi sayısı) ekleniyor — idareci "Devam et" derse gerçek üretim yapılır, "Vazgeç" derse hiçbir şey değişmez.
3. **"Kapasite" alanı kaldırıldı.** `weekly_capacity` sütunu hiçbir hard rule veya motor tarafından hiç okunmuyordu (sadece DB'de saklanıp gösteriliyordu) — kullanıcının "işe yaramıyorsa kaldıralım" isteğiyle Öğretmen formundan tamamen çıkarıldı. DB sütunu düşürülmedi (bilinçli — Faz 6'daki eski tablo temizliği kararıyla tutarlı, ayrı bir temizlik migration'ına bırakıldı).
4. **"Öncelik" alanına açıklama + görünür sıra numarası.** Lokasyonlar kartına rotasyonun tam olarak nasıl çalıştığını anlatan bir bilgi kutusu eklendi (öncelik DESC, sonra eklenme tarihi; 0 bırakılırsa eklenme sırası geçerli). Bölge listesi artık motorun kullandığı GERÇEK sırayla gösteriliyor ve her bölgenin yanında "Sıra #N" rozeti var — kullanıcı arayüzden doğrudan "sıradaki bölge bu" diye görebiliyor.

### Test kapsamı

- Yeni DB testi: `gün kısıtlı (sadece belirli gün) öğretmen HER hafta kendi gününü alır, desene katılıp kaybolmaz` — 3 hafta boyunca sadece Çarşamba çalışabilen bir öğretmenin üç Çarşamba'nın (10-07, 10-14, 10-21) HEPSİNİ aldığı doğrulanıyor.
- Tam paket: 131/131 yeşil.
- Tarayıcıda uçtan uca doğrulandı: "Sadece seçili günler" + Çarşamba işaretli bir öğretmen eklendi, 3 haftalık program üretildi — üç Çarşamba da doğru öğretmene atandı. "Program Oluştur"a basılınca (öğretmen sayısı kıt olduğu için) önce bir onay penceresi çıktı, tam olarak 6 boş kalacak yeri (tarih+gün+bölge) doğru listeledi; onaylayınca üretim gerçekleşti ve o 6 yer gerçekten boş kaldı (tahminle birebir eşleşti).

### Sonraki adım riskleri

1. **Faz 0 sadece `haftalik_yer` ve aylık modlarda ÇALIŞIYOR ama gün kısıtlı öğretmenlerin aylık modlardaki davranışı ayrıca test edilmedi** — aylık modlarda zaten gün/bölge daha az kayıyor (ay içinde sabit) ama gün kısıtlı biri yanlış güne denk gelen bir desen konumuna düşerse aynı sınıf sorun teorik olarak mümkün; kullanıcı bu kombinasyonu kullanmaya başlarsa ayrıca doğrulanmalı.
2. **`weekly_capacity` DB sütunu hâlâ duruyor** (arayüzden kaldırıldı ama düşürülmedi) — ileride bir temizlik migration'ında kaldırılabilir.
3. **Kıtlık önizlemesi motoru İKİ KEZ çalıştırıyor** (bir dry-run + bir gerçek) — büyük tarih aralıklarında (çok sayıda öğretmen/bölge/hafta) bu performans maliyeti gözlenirse önizleme sonucunu doğrudan "commit" eden ayrı bir yol eklenebilir (şu an bilinçli olarak basit tutuldu, YAGNI).

---

## Faz 7.4 — Gerçek kullanıcı verisinde bulunan 2 hata: kayıp gün + rotasyon hafızası

Kullanıcı canlı okulunun ürettiği gerçek çizelgeden iki ekran görüntüsü paylaştı: (1) bir haftada bir hafta içi günü (Çarşamba) tabloda hiç görünmüyordu; (2) bir öğretmen (Orhan Çiftçi) belirli bir haftaya kadar düzgün sırayla dönerken o haftadan sonra sırası tamamen karışmış ve bir daha düzelmemişti.

### Tamamlanan

1. **Kayıp gün — görüntüleme hatası.** `Dashboard.jsx`'teki `buildScheduleTable`, tablo satırlarını (`dates`) SADECE en az bir atama satırı olan günlerden üretiyordu. Haftalık nöbet limiti (max_duty_per_week) artık gerçek bir hard rule olduğundan, bir gün TÜM bölgelerde uygun aday kalmayabilir (kıtlık) — bu durumda o güne hiç satır yazılmıyor, dolayısıyla gün TABLODAN TAMAMEN KAYBOLUYORDU (boş bir satır olarak bile görünmüyordu). **Düzeltme:** `dates` artık sorgulanan aralığın (`viewedRange`, yeni state — üretilen/görüntülenen son aralığı tutar) TÜM hafta içi günlerinden üretiliyor; aynı sebeple `zoneNames` de artık satırlardan değil okulun güncel aktif bölge listesinden (`zones`) geliyor (bir bölgenin de aynı şekilde tamamen boş kalıp sütunuyla birlikte kaybolması mümkündü). Tatil günleri artık eski tasarımdaki gibi "🎌 ... — KAPALI" satırı olarak özel gösteriliyor (holidays state'inden `holidaysByDate` haritası).
2. **Rotasyon hafızası kaybı — motor hatası (gerçek kök neden bulundu).** `lib/db/bulkSchedule.js`'in çapa (anchor) mantığı SADECE bir önceki haftanın satırlarına bakıyordu. Bir hücre bir hafta boş kaldığında (yukarıdaki #1'in sebebiyle) o hücre için hiç satır yazılmıyor — bir SONRAKİ hafta AYRI bir `generateBulkSchedule` çağrısıyla üretilince (ki gerçek kullanım hep böyle: idareci zamanla farklı aralıklar için tekrar tekrar "Program Oluştur"a basıyor), çapa haftası o hücre için "hiç sahibi yokmuş" gibi yeniden kuruluyordu — desen o noktada SIFIRLANIYOR, yerine adillikle rastgele biri geçiyor, ve o andan sonra öğretmenin gerçek sırası bir daha geri gelmiyordu (kalıcı cursor olmadığından iz sürülemiyordu).
   - **Düzeltme (`haftalik_yer` modu):** Çapa artık sadece bir önceki haftaya değil, gerekirse en fazla 26 hafta geriye bakıyor — her (gün,bölge) hücresi için GERÇEK sahibi bulunana kadar. `lib/engine/rotation.js`'e eklenen saf `advanceWeekGridPosition(weekday, zi, zoneCount, steps)` fonksiyonu, gün-öncelikli tek döngüde bir hücrenin N adım sonra nereye geleceğini KAPALI FORMDA hesaplıyor (advanceWeekGrid'i N kez çağırmadan) — bulunan her eski hafta satırı, o haftadan çapaya kaç işlenebilir hafta geçtiği hesaplanıp buna göre doğru güncel hücreye yerleştiriliyor; daha YENİ bir haftadan zaten dolan hücreler ezilmiyor. Takvim günleri de bu geriye bakışı karşılayacak kadar geniş çekiliyor (yoksa o haftaların tatil olup olmadığı bilinmez, adım sayımı yanlış çıkar).
   - **Aylık modlara (`aylik_ayni_gun`/`aylik_farkli_gun`) bu geriye-bakış eklenmedi** — bilinçli kapsam daraltması (kullanıcının raporu ve ekran görüntüleri `haftalik_yer` modunu kullanıyordu); aynı sınıf hata orada da teorik olarak mümkün, aşağıda risk olarak not edildi.

### Test kapsamı

- Yeni DB testi: `bir hücre bir hafta boş kalırsa (çapa haftasında satır yoksa) sonraki AYRI üretimde ekibin sırası kaybolmaz` — 1. hafta üretilir, 2. hafta AYRI bir çağrıyla üretilir, 2. haftanın bir hücresi elle SİLİNİR (gerçek senaryoyu simüle eder), 3. hafta AYRI bir çağrıyla üretilir — 3. haftadaki ilgili hücrenin hâlâ 1. haftadan doğru türediği (silinme hiç olmamış gibi) doğrulanıyor.
- Tam paket: 130/130 yeşil.
- Tarayıcıda uçtan uca doğrulandı: tek öğretmenli/tek bölgeli test okulunda program üretildi, hafta içi TÜM 5 gün (dolu + boş) tabloda göründü; bir tatil eklenip yeniden üretildiğinde o gün "🎌 ... — KAPALI" olarak doğru gösterildi, "Aktif Gün" sayacı tatili doğru hariç tuttu.

### Sonraki adım riskleri

1. **Aylık rotasyon modlarında (`aylik_ayni_gun`/`aylik_farkli_gun`) aynı "tek hafta/ay'a bakan çapa" sınırlaması hâlâ duruyor** — kıtlık yüzünden bir hücre boş kalırsa orada da hafıza kaybı yaşanabilir; kullanıcı bu modları kullanmaya başlarsa aynı geriye-bakış deseni oraya da taşınmalı (farklı ilerleme matematiği gerektiriyor, ayrı bir artış).
2. **Bu düzeltme SADECE BUNDAN SONRAKİ üretimlerde düzelir.** Kullanıcının canlı okulunda ZATEN oluşmuş bozuk veriler (Orhan Çiftçi'nin geçmiş haftaları gibi) geriye dönük otomatik düzeltilmiyor — o aralıkları yeniden ürettiğinde (Program Oluştur) motor artık doğru sırayı bulup devam edecek, ama geçmişte zaten yazılmış satırlar olduğu gibi kalır.
3. **26 haftalık geriye bakış sınırı bir varsayım** — bir hücre 26 haftadan uzun süredir hiç dolmamışsa (çok uzun bir kıtlık dönemi) hâlâ "sahipsiz" sayılıp adillikle sıfırdan kurulur; makul bir okul senaryosunda bunun olması beklenmiyor ama teorik bir sınır.

---

## Faz 7.2 — Tek sayfa tasarıma dönüş + haftalık çift nöbet hatası

Kullanıcı iki şey bildirdi: (1) Faz 7.1'in 5 ayrı sayfalı (`/dashboard` hub + `/teachers` + `/duty-zones` + `/schedule` + `/rules` + `/account`) yapısı "çok karmaşık", eski panelin tek-sayfa hissi isteniyor; (2) haftalık yer değişiminde çift nöbet işaretli olmayan öğretmenler aynı hafta içinde iki kez nöbete giriyor. Ürün kararı belirsizdi (eski panelin kendisi mi, yoksa sadece gezinme mi tek sayfa olsun) — kullanıcıya TEK soru soruldu (CLAUDE.md kural), "gezinme tek sayfa, motor/tablo aynı kalsın" onaylandı.

### Tamamlanan

1. **Çift nöbet hatası — kök neden bulundu.** `lib/db/bulkSchedule.js`'in Faz B'si (boş hücre doldurma) sadece TOPLAM nöbet sayısına bakıyordu, bir öğretmenin AYNI HAFTA içinde başka bir güne zaten atanmış olup olmadığına bakmıyordu — bir kez böyle seçilen öğretmen haftalık desenin (grid) iki farklı gün×bölge hücresinin kalıcı "sahibi" oluyor, hata her hafta tekrarlıyordu. Bir önceki oturumda denenmiş "hard rule" çözümü (`checkMaxDutyPerWeek`'i `checkHardRules`'a ekleyip kesin engellemek) 6 gerçek DB testini kırmıştı (az öğretmenli okullarda hücreler gereksiz boş kalıyordu) — bu yaklaşım terk edildi.
2. **Düzeltme: hard rule → tercih katmanı.** `checkMaxDutyPerWeek` `checkHardRules` çalıştırıcısından çıkarıldı (`lib/engine/rules/index.js`); `lib/db/bulkSchedule.js`'in Faz B'sinde bir TERCİH olarak uygulanıyor — bu hafta henüz nöbeti olmayan (veya çift nöbetliyse hakkı dolmamış) adaylar önceliklidir, uygun aday hiç kalmazsa (kıtlık varsa) bu tercihin dışına çıkılır. `rules` tablosundaki `max_duty_per_week` aç/kapa anahtarı korundu ve gerçekten bu tercihi devre dışı bırakacak şekilde bağlandı (`activeRuleKeys.has('max_duty_per_week')`); Kurallar ekranındaki açıklaması yeni davranışı yansıtacak şekilde güncellendi (artık "kesin engel" değil, "boş hücre doldururken öncelik" diyor).
3. **Tek sayfa tasarım.** `/teachers`, `/duty-zones`, `/schedule`, `/rules`, `/account` route'ları kaldırıldı (page.jsx dosyaları silindi, middleware sadeleştirildi). Yeni `app/(wizard)/dashboard/Dashboard.jsx` (istemci bileşeni) tek bir üst header (okul adı + Çıkış Yap) + sekme çubuğu (Öğretmenler/Bölgeler/Program/Kurallar/Hesabım) gösteriyor; her sekme, iş mantığına HİÇ dokunulmayan var olan Manager bileşenini (`TeachersManager`, `DutyZonesManager`, `ScheduleManager`, `RulesManager`, `AccountManager`) render ediyor — sadece her birinin kendi tekrar eden `<header>`/Çıkış Yap/okul adı bloğu (ve artık kullanılmayan `useRouter`/`supabase` çağrıları) kaldırıldı. `dashboard/page.jsx` artık 5 sayfanın ilk verisini (öğretmenler, bölgeler, dönme modu, tatiller, aktif kurallar, abonelik) tek seferde paralel çekip `Dashboard`'a veriyor.
4. Her Manager'ın `actions.js`'indeki `revalidatePath('/teachers')` vb. çağrılar `revalidatePath('/dashboard')`'a çevrildi (sayfa artık orada).

### Teknik borç

- **Tab durumu URL'e yansımıyor** (sadece `useState`) — sayfayı yenilemek her zaman "Öğretmenler" sekmesine döner, belirli bir sekmeye link verilemez. Kullanıcı şikayeti sadece "karmaşık, tek sayfa olsun" idi, URL senkronizasyonu istenmedi — YAGNI ile ertelendi, ihtiyaç çıkarsa `?tab=` query param'ı küçük bir ekleme.
- **`selectTeachersForZone`/`getEligibleTeachersForZone` (lib/db/eligibility.js, tekil atama yolu)** haftalık tercihten YARARLANMIYOR — sadece toplu üretim (`bulkSchedule.js`) düzeltildi, çünkü kullanıcının raporu özellikle "haftalık yer değişikliğinde" (bulk rotasyon) hakkındaydı. Tekil yol zaten sadece toplam sayı adilliğiyle seçiyordu, bu turun kapsamı dışında bırakıldı.

### Test kapsamı

- Tam paket: 128/128 yeşil (bir önceki oturumun kırdığı 6 DB testi düzeltildi + yeni bir regresyon testi eklendi: yeterli öğretmen varken kimsenin aynı hafta içinde tekrar etmediğini doğruluyor).
- Tarayıcıda uçtan uca: yeni test okulu kaydı → `/dashboard` tek sayfa; Öğretmenler sekmesinde öğretmen eklendi, Bölgeler sekmesinde bölge eklendi, sayfa yenilenince veri kalıcı olduğu doğrulandı (sunucu state'i, sadece istemci state'i değil); Program/Kurallar/Hesabım sekmeleri render kontrolü yapıldı. `next build` production derlemesi hatasız (sadece `/dashboard` route'u kaldı).

### Sonraki adım riskleri

1. Diğer 4 Manager bileşeninin (Bölgeler/Program/Kurallar/Hesabım) uçtan uca akışları (bölge silme, program üretme, kural aç/kapa, elle atama ekleme/çıkarma) bu turda tek tek tıklanıp doğrulanmadı — sadece render/temel ekleme testi yapıldı, çünkü DB test paketi bu akışları zaten kapsıyor ve bileşenlerin iç mantığına dokunulmadı (sadece header kaldırıldı). Regresyon riski düşük ama sıfır değil.
2. Tekil atama yolu (`selectTeachersForZone`) haftalık tercihten habersiz kaldığı için, ileride bu yol daha çok kullanılırsa (örn. otomatik tekil atama önerisi gibi bir özellik gelirse) aynı çift-nöbet deseni orada da görülebilir → azaltma: aynı tiering mantığını oraya da taşımak küçük bir ek iş.

---

## Faz 7.1 — Eski panel emekliye ayrıldı: tek sistem

Kullanıcı `/dashboard` ile `/schedule`'ın iki farklı uygulama gibi davrandığını fark etti — haklıydı: `/dashboard` eski (panel) koduydu; kendi tabloları (`staff`/`locations`/`holidays`), kendi istemci taraflı dağıtım motoru ve kendi "Dağıtım Ayarları" vardı, yeni dönme düzenlerinden tamamen habersizdi. Üstelik giriş/kayıt sonrası varsayılan yönlendirme oraya gidiyordu.

- **`app/(panel)/` tamamen silindi** (Dashboard.jsx 560 satır + actions + css) ve `lib/engine/schedule.js` (eski istemci taraflı dağıtım motoru) kaldırıldı. `DAY_TR` → `lib/engine/weekday.js`'e, MEB tatil listesi → yeni `lib/engine/holidays.js`'e taşındı.
- **`/dashboard` artık yeni sistemin merkez sayfası** (`app/(wizard)/dashboard/page.jsx`): okul adı + 5 ekran kartı (Öğretmenler / Bölgeler / Program / Kurallar / Hesabım). Giriş/kayıt yönlendirmeleri değişmeden çalışıyor.
- **Tatil yönetimi yeni sisteme taşındı** — kritik boşluk: motorun okuduğu `calendar_days` için hiçbir UI yoktu; eski panelin tatil özelliği motorun HİÇ okumadığı `holidays` tablosuna yazıyordu. `/schedule`'a "Resmi Tatiller" kartı eklendi: elle tatil ekle/sil + "🎌 2026-2027 MEB Tatillerini Yükle" (29 gün, upsert — tekrar basmak kopya oluşturmaz). `lib/db/calendarDays.js`'e `getHolidays`/`upsertHolidays`/`deleteCalendarDay` eklendi.
- **Bug düzeltmesi:** `getSchoolForUser` `.single()` kullanıyordu — okulu silinmiş/kaydı yarım kalmış kullanıcıda tüm sayfalar çöküyordu ("Cannot coerce..."); `.maybeSingle()` yapıldı, artık "Henüz bir okula bağlı değilsin" düzgün gösteriliyor. (Kullanıcının daha önce bildirdiği tek seferlik `holidays` RLS hatası da büyük olasılıkla eski panelin bu karmaşasındandı — panel gitti, konu kapandı.)
- Eski `staff`/`locations`/`holidays` TABLOLARI DB'den düşürülmedi (yıkıcı migration atılmadı; `staff` RLS izolasyon testi hâlâ üzerinde koşuyor) → ileride temizlik migration'ı.

### Test kapsamı

- Tam paket 123/123 yeşil (silinen eski motorla birlikte 3 eski birim test de gitti).
- Tarayıcıda uçtan uca: yeni kayıt → `/dashboard` merkez sayfası açıldı; `/schedule`'dan MEB tatilleri tek tuşla yüklendi (29 kayıt listelendi); 26-30 Ekim üretiminde 29 Ekim (Cumhuriyet Bayramı) atandı DEĞİL, diğer 4 gün atandı. Test verisi temizlendi.

---

## Faz 7 — Dönme düzenleri: kullanıcının tam ürün tanımı (3 mod + tatilde sıra donması)

Kullanıcı rotasyonun tam spesifikasyonunu verdi; #3'teki haftalık kaydırma modeli bu tanımın üzerine genişletildi.

### Tamamlanan

1. **`supabase/migrations/0011_school_rotation_mode.sql`** (canlıya uygulandı) — `schools.rotation_mode` ('haftalik_yer' varsayılan / 'aylik_ayni_gun' / 'aylik_farkli_gun'), check kısıtı; schools'a update politikası + SADECE bu sütuna sütun-bazlı grant (okul adı/il/ilçe istemciden hâlâ değiştirilemez).
2. **`lib/engine/rotation.js`** — `advanceWeekGrid`: haftalik_yer'in bir adımı; hücreler gün-öncelikli TEK döngü (Pzt z0 → Pzt z1 → ... → Pzt zSon → Sal z0 → ... → Cum zSon → başa). Bölge +1 her hafta; bölge listesi sarınca GÜN +1 — kullanıcının "4 bölgeli okulda 5. hafta zemine döner ve Salı tutar" örneği birebir. `advanceMonthGrid({shiftDay})`: aylık modların adımı — aylik_ayni_gun: bölge +1, gün sabit; aylik_farkli_gun: bölge +1 VE gün +1 ("Pzt zeminde başlayan ay bitince Salı 1. katta"). Hepsi saf, 8 yeni birim test.
3. **`lib/db/bulkSchedule.js`** — mod seçimine göre hafta/ay geçişlerinde ızgarayı ilerletir. **Tatilde sıra dönmez:** sadece en az bir okul günü içeren hafta/aylar sayılır (`countSchedulableWeeks`/`countSchedulableMonths`); tamamen tatil bir hafta/ay sıralamayı İLERLETMEZ, kaldığı yerden devam eder. Çapa artık `getLatestAssignmentDateBefore` ile bulunur (sadece "bir önceki hafta" değil — uzun tatil sonrası da DB'deki son üretilmiş haftadan devam eder; #3'ün 1. riski kapandı).
4. **UI** — `/schedule` ekranına "Dönme Düzeni" seçici (3 mod, okul bazlı, anında kaydedilir; tatilde sıranın ilerlemediğini açıklayan bilgi kutusu). Öğretmen ekleme formunda çift nöbet + gün kısıtı zaten soruluyordu (kullanıcı şartı 1 — mevcut davranış, değişiklik gerekmedi).
5. Yeni DB testleri (4): tek bölgeli okulda gün +1/hafta (döngü sarınca gün değişimi); tamamen tatil haftanın sırayı ilerletmediği; aylik_ayni_gun (ay içi sabit + ay geçişinde bölge +1 gün aynı); aylik_farkli_gun (bölge +1 VE gün +1, günleri ayırt edebilen 4 öğretmenli kurulum).

### Bilinçli kararlar

- "Ay" = takvim ayı. Ay içinde düzen sabittir (aylık modlarda öğretmen her hafta aynı gün aynı yerde tutar) — kullanıcı tanımının doğrudan sonucu.
- Sıra durumu için hâlâ kalıcı cursor yok — düzen DB'deki son üretilmiş hafta/aydan türetilir (idempotent, "Program Oluştur"a tekrar basmak sırayı bozmaz).
- Desende sahibi olmayan hücreler adillikle dolar ve dolduran desene katılır; sahibi olup o gün uygun olmayanın yeri korunur (desen bozulmaz).

### Test kapsamı

- Birim: `advanceWeekGrid`/`advanceMonthGrid` 8 test (geçer + eler senaryoları). DB: `bulkSchedule.test.js` 12 test (4 yeni).
- Tarayıcıda uçtan uca: mod seçici 3 seçenekle render oldu; `aylik_farkli_gun`'a geçiş RLS'ten geçip kaydedildi; Eylül+Ekim üretiminde "AYSE BIR: Eylül Pzt ZEMİN → Ekim Salı 1. KAT" birebir doğrulandı. Test verisi temizlendi.
- Tam paket: 126/126 yeşil.

### Sonraki adım riskleri

1. Aylık modlarda bölge sayısı 5'in katıysa (aylik_farkli_gun) bazı gün×yer kombinasyonları hiç ziyaret edilmez (matematiksel: gün ve bölge aynı anda +1 gittiği için) — kullanıcının tanımladığı davranış böyle, ama okullar sorarsa açıklamak gerekebilir.
2. Mod değişikliği geçmişe dokunmaz; değişiklikten sonraki ilk üretim, son üretilmiş haftayı yeni modun çapası olarak kullanır — geçiş haftasında sıra "yeni modun mantığıyla" bir adım atar, bu beklenmedik görünebilir.

---

## Faz 6 sonrası düzeltme #3 — Rotasyon algoritması yeniden yazıldı: haftalık sıralı yer değişimi

Kullanıcı, #1 ve #2'deki düzeltmelere rağmen gerçek çizelge ekran görüntüsüyle sorunu netleştirdi: "Kudsi Ata 1. hafta Pazartesi A Blok'taysa 2. hafta Pazartesi B Blok olmalı" — yani beklenen model öğretmen bazlı opt-in rotasyon değil, TÜM çizelgenin haftalık sıralı kayması. Eski model (rotations tablosu + zone_cursor, öğretmen başına) bu beklentiyi yapısal olarak karşılayamıyordu: herkes cursor 0'dan başlayınca çakışıyor, kaybeden Faz B adilliğine düşüp "sıra atlamış" görünüyordu.

- **Yeni model (`lib/db/bulkSchedule.js`, baştan yazıldı):** Her haftanın gününün (Pazartesi, Salı, ...) kendi öğretmen ekibi vardır; bir sonraki hafta AYNI GÜNÜN ekibi bölge listesinde (öncelik + eklenme sırası) BİR bölge ileri kayar, sondaki başa döner. Kalıcı cursor YOK — bir haftanın düzeni bir önceki haftanın düzeninden türetilir: aralıktan önceki haftada DB'de atama varsa o düzenin kaydırılmışı (çapa), yoksa ilk hafta adillikle sıfırdan kurulur. Bu tasarım gereği idempotent: aynı aralığı tekrar üretmek aynı çizelgeyi verir, aralığı uzatmak/sadece sonraki haftayı üretmek sırayı DB'deki son haftadan devam ettirir.
- Kaydırılan öğretmen o gün uygun değilse (izin/kapalı bölge/kural) o hücre adillik doldurmasına düşer ama DESEN bozulmaz — ertesi hafta öğretmen kendi sırasındaki bölgeye döner. `is_manual` satırlar korunur; idareci 1. haftayı elle düzenlerse sonraki haftalar o düzenden türer ("sıra nasıl olsun" kontrolü = ilk haftanın kendisi + bölge ekleme sırası).
- **Kaldırılanlar (model değişikliğinin doğal sonucu):** `lib/db/rotations.js`, öğretmen ekranındaki "🔄 Rotasyon" paneli ve üç rotasyon action'ı (#2'de eklenen "başlangıç bölgesi" seçici dahil — artık gereksiz), `rotations` tablosuna dayalı Faz A. `rotations` TABLOSU migration'la düşürülmedi (yıkıcı değişiklik yapılmadı, tenant izolasyon RLS testi hâlâ üzerinde koşuyor); ileride bir temizlik migration'ında düşürülebilir.
- **Görüntüleme düzeltmesi:** çizelge tablosunun bölge sütunları alfabetik sıralanıyordu — rotasyonun "bir sonraki bölge" sırasıyla (öncelik + eklenme sırası) aynı olacak şekilde düzeltildi (`ScheduleManager.jsx`, `getAssignmentsForRange` join'ine `priority`/`created_at` eklendi). Aksi halde doğru rotasyon bile ekranda karışık görünürdü.
- `lib/engine/rotation.js` sadeleşti: `getWeekStart`, `addDays`, `weeksBetween`, `shiftLayout` (hepsi saf, birim testli); `groupDatesByWeek`/`getZoneForCursor` silindi.

### Test kapsamı

- Yeni DB testleri (`tests/db/bulkSchedule.test.js`): (1) 3 öğretmen × 3 bölge × 3 hafta — her Pazartesi ekibi bir sonraki hafta bir sonraki bölgede; (2) aynı aralığı 3 kez üretmek düzeni birebir korur + sadece 2. haftayı üretmek DB'deki 1. haftadan doğru devam eder. Eski cursor tabanlı testler (`rotationSchedule.test.js`, `rotationToggle.test.js`) modelle birlikte silindi.
- Tarayıcıda uçtan uca: 3 bölge (A BLOK → B BLOK → BAHCE eklenme sırası) + 3 öğretmenli test okulunda `/schedule`'dan 3 hafta üretildi — ARIFE CAN: A→B→BAHCE, KUDSI ATA: B→BAHCE→A, SELMA DIREK: BAHCE→A→B (birebir kullanıcının istediği desen). Tekrar üretim aynı tabloyu verdi; sadece 4. hafta üretilince sıra DB'den doğru devam etti (ARIFE BAHCE→A başa sardı). Test verisi temizlendi.
- Tam paket: 116/116 yeşil.

### Sonraki adım riskleri

1. **Çapa yalnızca bir önceki haftaya bakar** — uzun tatil sonrası (aralıktan önceki hafta tamamen boşsa) düzen adillikle sıfırdan kurulur, tatil öncesi sıradan devam etmez → azaltma: gerekirse çapa aramasını birkaç hafta geriye genişletmek küçük bir değişiklik.
2. **Hafta içi ekipler sabittir** — Pazartesi ekibi hep Pazartesi nöbet tutar (gün değişimi yok); kullanıcı gün rotasyonu da isterse ayrı bir artış gerekir.
3. **`rotations` tablosu artık motor tarafından kullanılmıyor** ama şemada duruyor → azaltma: ileride temizlik migration'ı.

---

## Faz 6 sonrası düzeltme — Rotasyon cursor idempotency + bölge sıralaması

Gerçek kullanıcının kendi okuluyla canlı test etmesi sırasında bulunan iki rapor: "bazı öğretmenlere çift nöbet vermiş" ve "rotasyon bazen bir sıra atlayıp başka yere geçiyor".

- **Rotasyon sırası atlıyor — kök neden bulundu ve düzeltildi.** `generateBulkSchedule` (Faz A), bir haftayı işledikten sonra `rotations.zone_cursor`'ı **koşulsuz** ilerletiyordu — aynı tarih aralığı (veya onu kapsayan bir aralık) tekrar üretilirse (kullanıcı "Program Oluştur"a tekrar basarsa) cursor her seferinde bir daha ileri sarıyordu. Gerçek kullanım sırasında (test/düzeltme amaçlı tekrar tekrar üretmek) bu, bir öğretmenin beklenenden fazla bölge atlamasına yol açar. **Düzeltme:** `lib/db/bulkSchedule.js` — cursor artık "`last_advanced`'a kayıtlı haftanın bölgesi" anlamına geliyor; bir hafta yalnızca `last_advanced`'dan DAHA YENİ ise cursor ilerletiliyor, aynı (veya daha eski) hafta tekrar işlenirse cursor sabit kalıyor. Yeni regresyon testi (`tests/db/bulkSchedule.test.js`): aynı aralığı 3 kez üretmek cursor'ı sabit tutuyor; aralığı bir hafta uzatmak cursor'ı tam olarak bir ilerletiyor. Var olan `tests/db/rotationSchedule.test.js` cursor'ın artık "sıradaki" değil "mevcut haftanın" bölgesini gösterdiği yeni semantiğe göre güncellendi.
- **Bölge sıralaması alfabetikti, eklenme sırası değil.** `lib/db/dutyZones.js`'teki `getDutyZones` ikincil sıralama olarak `name` kullanıyordu; `priority` alanı hiç ayarlanmamış (varsayılan 0) okullarda bu, rotasyon cursor'ının bölgeleri **alfabetik** sırayla dolaşması demekti — kullanıcı bölgeleri ekleme sırasıyla dönmesini bekliyordu. Kullanıcının "ya buton ya da eklenme sırası" isteğinden ikincisi seçildi (daha basit, ek UI gerektirmiyor — YAGNI): ikincil sıralama `created_at`'e çevrildi. `priority` alanı hâlâ elle öne alma için kullanılabilir durumda (0'dan farklı bir değer verilirse önceliği geçersiz kılar). Yeni test (`tests/db/duty-zones-crud.test.js`): eşit priority'li bölgeler bilerek alfabetik ters sırayla eklenip listenin eklenme sırasını yansıttığı doğrulandı.
- **Çift nöbet raporu — kök neden BULUNAMADI.** `bulkSchedule.js`'in Faz A/Faz B paylaşımlı `dailyCounts` mekanizması, `checkMaxDutyPerDay` kuralı ve `rules` tablosu (gerçek okullarda hiç satır yok → varsayılan olarak tüm kurallar aktif) üç ayrı geçişte satır satır incelendi, bug bulunamadı — mantık doğru görünüyor (aynı gün ikinci bir otomatik atama, `allow_double_duty=false` bir öğretmen için doğru şekilde engelleniyor, mevcut testler bunu kanıtlıyor). Kullanıcının gerçek okulunda şu an 0 öğretmen/0 atama olduğundan (veri temizlenmiş) olayı yeniden üretecek gerçek veri incelenemedi. **Elle ekleme ("+" butonu) yolunun HİÇBİR kural kontrolünden geçmediği** fark edildi — bu, idarecinin bilerek elle ikinci bir atama yapması senaryosunda beklenen bir davranış (kilitli/elle düzenleme motoru bilerek geçersiz kılar), ama kullanıcı "işaretlemedim" diyorsa bu yol muhtemelen değil. **Sonraki adım:** kullanıcıdan hangi öğretmen/tarih, "Program Oluştur" mu yoksa elle "+" ile mi olduğu soruldu — gerçek veriyle yeniden üretilebilirse kök neden kesinleşecek.

### Test kapsamı

Tam paket: 119/119 yeşil (2 yeni test eklendi, 1 var olan test yeni doğru semantiğe göre güncellendi).

---

## Faz 6 sonrası düzeltme #2 — ~~Rotasyon sırası için elle "başlangıç bölgesi" kontrolü~~ (düzeltme #3 ile kaldırıldı — model değişti)

Yukarıdaki idempotency + eklenme-sırası düzeltmelerinden sonra kullanıcı hâlâ "bazı öğretmenler tam sırasında dönmüyor" bildirdi ve kökten bir çözüm için "sıra nasıl olsun diye buton ekleyip ona göre döndürelim" istedi.

- **Gerçek kök neden: rotasyona dahil edilen HER öğretmen cursor 0'dan (aynı bölgeden) başlıyor.** `createRotation` her zaman `zone_cursor=0` ile başlatıyor (bilinçli, `lib/db/rotations.js`). Birden fazla öğretmen rotasyondaysa, ikisi de aynı haftada aynı bölgeyi "istiyor" — biri Faz A'da o bölgeye yerleşir, "çakışan" diğer öğretmen o hafta o bölgeye giremez ve Faz B'nin (basit adillik) rastgele/adalet-tabanlı doldurmasına düşer. Bu, o öğretmen için o haftanın rotasyon sırasını tamamen dışarıda bırakıyor — kullanıcıya "sırası atlıyor/karışıyor" gibi görünen tam olarak bu.
- **Düzeltme — idareci artık her rotasyondaki öğretmenin başlangıç bölgesini elle seçebiliyor.** `lib/db/rotations.js`'e `setRotationZone(supabase, rotationId, zoneCursor)` eklendi: cursor'ı verilen bölgeye sabitler, `last_advanced`'ı null'a çeker (yeni rotasyon oluşturmakla aynı "temiz başlangıç" anlamına gelir — bir sonraki üretim bu bölgeyi bir ileri kaydırmadan doğrudan kullanır). `app/(wizard)/teachers/actions.js`'e `setTeacherRotationStartZone(teacherId, zoneId)` server action'ı eklendi (bölge id'sini okulun aktif bölge listesindeki index'e çevirir — motorun kullandığı SIRAYLA birebir aynı liste).
- **UI (`TeachersManager.jsx`, "🔄 Rotasyon" paneli):** ham `zone_cursor` sayısı yerine artık bölge adlarından oluşan bir `<select>` gösteriliyor ("Şu anki / başlangıç bölgesi") — idareci hem mevcut konumu bölge adıyla görüyor hem de değiştirebiliyor. Çakışma riskini açıklayan bir yardım metni eklendi.
- Yeni bölge/öğretmen ekleme akışına dokunulmadı (YAGNI — ayrı bir "sıra sihirbazı" eklenmedi, var olan `priority`/`created_at` tabanlı bölge sırasını ve şimdi eklenen öğretmen-başlangıç-noktası kontrolünü birleştirmek yeterli).

### Test kapsamı

- `tests/db/rotationToggle.test.js`: `setRotationZone` cursor'ı doğru ayarlıyor ve `last_advanced`'ı sıfırlıyor (1 yeni test).
- `tests/db/bulkSchedule.test.js`: iki rotasyondaki öğretmene farklı başlangıç bölgesi verilince (biri varsayılan A, diğeri elle B) çakışmadan kendi bölgelerinde kaldıkları, gerçek Supabase'e karşı `generateBulkSchedule` ile doğrulandı (1 yeni test).
- Tarayıcıda uçtan uca doğrulandı: yeni bir test okulunda 2 bölge + 2 öğretmen oluşturuldu, T1 rotasyona dahil edildi (varsayılan Zone A), select'ten Zone B seçilip "Başlangıç bölgesi güncellendi" toast'ı görüldü; Supabase CLI ile `zone_cursor=1, last_advanced=null` olarak doğru kaydedildiği kanıtlandı. Test verisi temizlendi.
- Tam paket: 121/121 yeşil.

### Sonraki adım riskleri

1. **Bölge sırası hâlâ okul çapında tek bir liste** (`priority`/`created_at`) — öğretmen bazlı "sadece A ve C bölgeleri arasında dön, B'yi hiç görme" gibi bir kısıtlama yok. Şu an kimse istemedi, YAGNI ile ertelendi.
2. **`setTeacherRotationStartZone` sadece "başlangıç" konumunu ayarlıyor, geçmiş atamaları yeniden yazmıyor** — idareci bir öğretmenin bölgesini değiştirdiğinde daha önce üretilmiş (geçmiş haftalardaki) atamalar olduğu gibi kalır, sadece bundan sonraki üretim yeni bölgeden başlar. Bilinçli — kilitli/elle düzenlenmiş geçmiş veriye dokunmamak motorun genel idempotency ilkesiyle tutarlı.

---

## Faz 6 sonrası düzeltme — Teşkilat şeması çekme: ikinci MEB şablonu + ölçekleme kararı

Gerçek bir kullanıcının kendi okuluyla (zseilkokulu.meb.k12.tr) canlı test etmesi sırasında bulundu.

- **Bulgu:** MEB k12.tr okul siteleri tek bir sabit HTML şablonu kullanmıyor. Faz 3'te test edilen ilk okulda (durmusyasario.meb.k12.tr) kişiler `<a>AD SOYAD<br/><span>ROL</a>` biçimindeydi; bu kullanıcının okulunda `<a title="ROL">AD SOYAD</a>` — `<br>`/`<span>` hiç yok. Eski regex ikinci şablonda 0 kişi buluyordu.
- **Düzeltme:** `app/(wizard)/teachers/actions.js`'teki `PERSON_RE`, `<br>`/`<span>` kısmını isteğe bağlı (yok sayılan) bir grup olarak eşleştirecek şekilde genelleştirildi — isim her zaman açılış etiketinden sonraki ilk düz metin, rol her zaman `title` özniteliğinde, iki şablonda da aynı. Her iki gerçek okul sitesine karşı doğrulandı (ham HTML + tarayıcıda uçtan uca): eski şablon 23 kişi (değişmedi), yeni şablon 74 kişi bulundu → 48'i doğru filtrelenip eklendi. Tam paket 117/117 yeşil.
- **Ölçekleme kararı (kullanıcı onayıyla):** Ürün 1000+ okulda kullanılacak. Merkezi/toplu bir link-çekme mekanizması **istenmedi** — her okul idarecisi kendi hesabına kaydolup kendi teşkilat şeması linkini bir kez girer (mevcut model zaten bunu destekliyor, ek bir mimari değişiklik yapılmadı). **Kalıcı risk:** MEB şablonlarının en az 2 varyantı olduğu şimdi kanıtlandı — 1000+ okul arasında henüz görülmemiş üçüncü bir varyant çıkma ihtimali var. Böyle bir durumda `/teachers` ekranındaki mevcut "elle öğretmen ekle" formu zaten bir yedek yol olarak duruyor, ve hata mesajı ("Bu sitenin yapısı desteklenen şablondan farklı olabilir") idareciyi bilgilendiriyor — ama otomatik çekme o okul için çalışmayacak, yeni şablon görüldükçe regex'in genişletilmesi gerekecek.

---

## Faz 6 — Abonelik (şema + plan durumu, ödeme entegrasyonu yok)

### Tamamlanan

1. **`supabase/migrations/0010_subscriptions.sql`** — Faz 2'de "ayrı bir migration'da (0010) gelecek" diye ertelenmiş, o zamandan beri hiç dokunulmamıştı. `subscriptions` tablosu: `plan_type` ('trial'/'standard' — ikincisi henüz seçilebilir değil, yer tutucu), `status` ('trialing'/'active'/'expired'/'canceled'), `trial_ends_at`, `current_period_end`, `unique(school_id)`. RLS: sadece `select` (kullanıcı kendi planını değiştiremez — gerçek ödeme entegrasyonu gelince ayrı bir `SECURITY DEFINER` fonksiyon insert/update yapacak, bilinçli). `register_school` fonksiyonu `create or replace` ile güncellendi: her yeni okul kaydında otomatik olarak **14 günlük deneme** başlatan bir `subscriptions` satırı da oluşturuyor (0001/0002'deki gibi aynı desen, geriye dönük hiçbir şeyi bozmadı — `tests/db/tenant-isolation.test.js` hâlâ 5/5 yeşil).
2. **`lib/engine/subscription.js`** (saf) — `getSubscriptionStatus({status, trialEndsAt, currentPeriodEnd, now})`: plan durumunu okunabilir bir özete (`label`, `isUsable`, `daysRemaining`) çevirir. 5/5 test.
3. **`lib/db/subscriptions.js`** — `getSubscriptionForSchool(schoolId)`. Kasıtlı olarak sadece okuma fonksiyonu var — yazma izni yok (yukarıya bakın).
4. **`app/(wizard)/account/`** (yeni ekran) — "Hesabım": abonelik durumunu ("Deneme Sürümü", "X gün kaldı") gösterir, ödeme entegrasyonu henüz aktif olmadığını açıkça belirtir (yanlış izlenim vermemek için sahte bir "yükselt" butonu eklenmedi). `middleware.js`'e `/account/:path*` eklendi.
5. `tests/db/subscriptions.test.js`: gerçek Supabase'e karşı 2 senaryo — yeni kayıt olan bir okulun otomatik 14 günlük deneme aldığı (`trial_ends_at` ~14 gün sonrası, birkaç saniye toleranslı), ve RLS ile başka bir okulun abonelik satırının okunamadığı doğrulandı. Tarayıcıda uçtan uca doğrulandı: yeni kayıt → `/account` → "Deneme Sürümü, 14 gün kaldı" doğru göründü; migration öncesi oluşmuş eski bir okulda (`subscriptions` satırı yok) sayfa çökmeden "Abonelik bilgisi bulunamadı" gösterdi.
6. **Deneme süresi kısıtlaması.** `lib/db/subscriptions.js`'e `requireUsableSubscription(schoolId)` eklendi — abonelik yoksa veya `getSubscriptionStatus().isUsable === false` ise hata fırlatır. Savunma amaçlı en derin noktaya kondu: `lib/db/bulkSchedule.js`'in (`generateBulkSchedule`) ve `lib/db/scheduling.js`'in (`assignTeachersToZone`, tekil) en başına — hangi çağıran üzerinden gelirse gelsin atlanamaz. `tests/db/subscriptionGuard.test.js`: 2/2 (geçerli denemede üretim çalışıyor; `subscriptions` tablosunda authenticated için yalnızca `select` izni olduğu için — bilinçli tasarım — kullanıcının kendi aboneliğini güncelleyemediği RLS testiyle doğrulandı). "Engellendi mi" senaryosu otomatik testte kurulamadığından (aynı RLS nedeniyle) Supabase CLI ile servis düzeyinde SQL kullanılarak tarayıcıda uçtan uca doğrulandı: `status='expired'` yapılan bir okulda "Program Oluştur" tıklanınca "Hata: Abonelik durumu: Süresi Doldu. Devam etmek için Hesabım sayfasını kontrol edin." mesajı doğru göründü, hiçbir atama oluşmadı. Tam paket 117/117 yeşil.

### Bilinçli kararlar / teknik borç

- **Gerçek ödeme entegrasyonu yok** (kullanıcı onayıyla, bu turun kapsamı bilinçli olarak sadece şema + plan durumu). Hangi sağlayıcı (iyzico/Stripe/PayTR vb.) kullanılacağı ayrı, büyük bir ürün kararı — ödeme alma, plan aktive etme, iptal/yenileme akışları hiçbiri yok.
- **14 günlük deneme süresi bir varsayım**, gerçek bir iş kararı olarak onaylanmadı — kolayca değiştirilebilir (`0010_subscriptions.sql`'deki `interval '14 days'`).
- **`plan_type='standard'` seçilebilir değil** — şu an sadece şemada yer tutucu, gerçek bir ücretli plan tanımı/satın alma akışı yok.
- **Kısıtlama sadece "atama üreten" iki fonksiyonda** (`generateBulkSchedule`, `assignTeachersToZone`) — öğretmen/bölge ekleme, kural ayarları gibi diğer yazma işlemleri deneme süresi dolsa bile çalışmaya devam ediyor. Bilinçli: en değerli/motor işlevini kilitlemek yeterli görüldü, veri girişini kilitlemek deneme sonrası geçişi zorlaştırabilirdi.
- **UI'da önleyici bir uyarı yok** — idareci sadece "Program Oluştur"a bastığında hatayı görüyor, deneme süresinin bitmek üzere olduğuna dair önceden bir banner/bildirim yok (sadece `/account` sayfasını ziyaret ederse görür).

### Test kapsamı

- `lib/engine/`: `subscription.js` 5/5.
- `lib/db/`: `subscriptions.test.js` 2/2, `subscriptionGuard.test.js` 2/2.
- Tam paket: 117/117 yeşil.

### Sonraki adım riskleri

1. **Ödeme sağlayıcısı entegrasyonu yok** → deneme süresi dolan bir okul artık engelleniyor ama gerçek bir ödeme yaparak devam edemiyor (bir çıkmaz sokak) → azaltma: ayrı, büyük bir ürün kararı (sağlayıcı seçimi) + artış gerekiyor.
2. **Önleyici uyarı/banner yok** → azaltma: `/schedule` veya genel layout'a "deneme süreniz N gün sonra bitiyor" gibi bir uyarı eklenebilir.

---

## Faz 5 — Scheduling Engine (motor uçtan uca çalışıyor: kural → rotasyon → yapılandırılabilirlik)

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
10. `tests/db/scheduling.test.js`: gerçek Supabase'e karşı 2 senaryo — 3 adaydan `required_count=2` kadarının seçilip DB'ye yazıldığı (dönüş değeri değil, ayrı bir sorguyla tekrar okunarak doğrulandı), ve uygun aday yokken hata fırlatmadan boş dizi döndüğü.
11. **Toplu program üretimi (Bulk Schedule Runner).** `lib/engine/scheduler.js` (saf): `eachDateStr(start,end)` tarih aralığını güne böler, `isSchedulableDay({weekday, calendarDay})` hafta sonu (0/6) veya `day_type='holiday'` olan günleri eler (`half_day`/`ceremony`/`exam` kullanıcı onayıyla bu turda normal gün sayılır). `lib/db/bulkSchedule.js` (yeni orchestrator): `generateBulkSchedule(supabase, {schoolId, startDate, endDate})` — önce o aralıktaki eski otomatik (`is_manual=false`) atamaları siler (idempotency, elle düzenlenmiş satırlara dokunmaz), sonra TÜM gerekli veriyi (öğretmen/bölge/kapanış/müsaitlik/takvim) bir kez çekip bellek içi `checkHardRules`+`selectFairest` ile gün×bölge döngüsü kurar, günlük sayaç ile aynı öğretmenin aynı gün farklı bölgelere (double-duty izni olmadan) atanmasını engeller, toplam sayaç günler arasında sürekli birikir, sonunda tek toplu `createAssignments` ile yazar. Yeni toplu okuma fonksiyonları: `lib/db/calendarDays.js` (`getCalendarDays`), `lib/db/zoneClosures.js`'e `getZoneClosuresForZones`, `lib/db/dutyAssignments.js`'e `deleteAutoAssignmentsInRange`.
12. `tests/unit/scheduler.test.js`: 10/10 (tarih üretimi + hafta sonu/tatil filtreleme, DB'siz). `tests/db/bulkSchedule.test.js`: gerçek Supabase'e karşı 5 senaryo — hafta sonu atlama, tatil atlama, tek öğretmen+iki bölgede çift atama olmaması, iki kez çalıştırınca sayının değişmemesi (idempotency), iki öğretmen arasında adil dağılım (fark ≤1).
13. **`app/(wizard)/schedule/`** — "Program Oluştur" ekranı: başlangıç/bitiş tarihi, `generateBulkSchedule`'ı tetikleyen buton, yıkıcı silme adımı için `window.confirm()` ile açık onay (native dialog — ayrı bir modal bileşeni bu MVP'de gerekmedi). `middleware.js`'e `/schedule/:path*` eklendi. Tarayıcıda uçtan uca doğrulandı: 2 öğretmen + 1 bölge ile bir haftalık program oluşturuldu (5 hafta içi gün, SQL'den doğrulandı — 3-2 adil dağılım), aynı aralık tekrar çalıştırıldığında toplam kayıt sayısı hâlâ 5 (idempotency UI'dan da doğrulandı).
14. **Program Görüntüleme.** `lib/db/dutyAssignments.js`: `getAssignmentsForRange(supabase, schoolId, startDate, endDate)` — `teachers`/`duty_zones` join'li atama listesi. `app/(wizard)/schedule/`'a eklenen `fetchScheduleView` server action'ı + `ScheduleManager.jsx`'teki tarih×bölge tablosu: program oluşturunca otomatik gösteriliyor, ayrıca bağımsız bir "Görüntüle" butonuyla (yeniden üretmeden) mevcut bir aralık sorgulanabiliyor. Gün adları için `lib/engine/schedule.js`'teki mevcut `DAY_TR` sabiti yeniden kullanıldı (yeni bir kopya yazılmadı).
15. **Elle düzenleme/kilitleme UI'ı.** `lib/db/dutyAssignments.js`'e `createManualAssignment` (`is_manual=true`) ve `deleteAssignment` eklendi. `app/(wizard)/schedule/actions.js`'e `fetchTeacherOptions`, `addManualAssignment`, `removeAssignment` server action'ları eklendi. Program Görüntüleme tablosundaki her hücre artık öğretmen "chip"leri (× ile kaldırma) + "+ Ekle" (öğretmen seçip elle atama ekleme, otomatik `is_manual=true`) gösteriyor; elle eklenen kayıtlar 🔒 ile işaretleniyor. `tests/db/manualAssignment.test.js`: 2/2 yeşil.
16. **Bulk runner'da bulunan ve düzeltilen gerçek bir hata:** Tarayıcıda uçtan uca test ederken (elle bir atama ekleyip programı yeniden oluşturarak) `generateBulkSchedule`'ın, bir gün+bölge zaten elle doldurulmuşken `zone.required_count`'u hesaba katmadan yine de yeni otomatik atama eklediği ve kapasiteyi aştığı görüldü. `lib/db/bulkSchedule.js` düzeltildi: silme adımından sonra aralıkta kalan (sadece `is_manual=true` olabilecek) satırlar önceden çekilip `existingCountByDateZone` ve `existingTeacherIdsByDate` map'lerine indirgeniyor; her bölge için `remainingSlots = max(0, required_count - alreadyFilled)` hesaplanıyor, günlük sayaç da elle yapılmış atamalardan başlıyor (aynı gün başka bölgeye elle atanmış bir öğretmen artık günlük limiti aşarak tekrar seçilemiyor). `tests/db/bulkSchedule.test.js`'e regresyon testi eklendi (6. senaryo). Canlıda da (tarayıcı + SQL) doğrulandı.
17. **Gerçek rotasyon algoritması — haftalık yer (sadece bu mod, kullanıcı onayıyla).** `lib/engine/rotation.js` (saf): `getWeekStart(dateStr)` bir tarihin haftasının Pazartesi'sini bulur, `groupDatesByWeek(dates)` sıralı tarihleri ardışık haftalara gruplar, `getZoneForCursor(zoneIds, cursor)` cursor'ı döngüsel olarak bir `zone_id`'ye çevirir. `lib/db/rotations.js` (yeni): `getRotationsByMode`, `advanceRotation`. `lib/db/bulkSchedule.js` artık iki fazda çalışıyor — **Faz A (rotasyon):** `rotations` tablosunda `rotation_mode='haftalik_yer'` olan her öğretmen, cursor'ın gösterdiği bölgede (okulun aktif bölgeleri `priority DESC, name` sıralı bir döngü, `getDutyZones` zaten bu sırada döndürüyor) bir hafta boyunca kalır; hafta bitince cursor ilerletilip `rotations` tablosuna kalıcı olarak yazılır (`cycle_count` sarma anını, `last_advanced` hangi haftaya kadar ilerletildiğini kaydeder — rotasyon geçmişi böyle korunur). **Faz B (basit adillik):** Faz A'dan sonra kalan boş slotları önceki turdaki mantıkla doldurur, değişmedi. Tasarım sırasında yakalanan bir hata: bir `generateBulkSchedule` çağrısı birden fazla haftayı kapsıyorsa, cursor'ın bellek içi kopyası her hafta için güncellenmezse (sadece DB'ye yazılıp `rotation` nesnesi mutasyona uğratılmazsa) tüm haftalar aynı bölgeyi kullanırdı — düzeltildi, testle doğrulandı.
18. `tests/unit/rotation.test.js`: 9/9 (DB'siz). `tests/db/rotationSchedule.test.js`: gerçek Supabase'e karşı 2 haftalık aralık — rotasyondaki öğretmenin 1. hafta A, 2. hafta B bölgesine atandığı, cursor'ın kalıcı olarak doğru ilerletildiği (0→1→0, `cycle_count`=1, `last_advanced`=2. haftanın Pazartesi'si), rotasyon dışı slotların hâlâ Faz B ile dolduğu doğrulandı — 3/3 yeşil. Tarayıcıda `/schedule` ekranıyla regresyon kontrolü yapıldı (rotasyona dahil olmayan öğretmenler için davranış değişmedi).
19. **Rotasyona öğretmen ekleyen UI.** `lib/db/rotations.js`'e `getRotationForTeacher`, `createRotation`, `deleteRotation` eklendi. `app/(wizard)/teachers/actions.js`'e `fetchTeacherRotation`, `toggleTeacherRotation` server action'ları eklendi. Öğretmen Yönetimi ekranındaki her satıra "🔄 Rotasyon" düğmesi eklendi ("Müsaitlik" ile aynı desende) — açılan panelde bir checkbox ile öğretmen `haftalik_yer` rotasyonuna dahil edilip çıkarılabiliyor, dahilse şu anki döngü sırası/tamamlanan tur/son ilerleme tarihi gösteriliyor. `tests/db/rotationToggle.test.js`: 3/3 yeşil. Tarayıcıda uçtan uca doğrulandı: checkbox işaretlenince `rotations` satırı SQL'den doğrulandı (`zone_cursor=0`), işaret kaldırılınca satır silindiği doğrulandı.
20. **`rules` tablosu bağlantısı (Faz 4'ten devreden son risk kapandı).** `lib/engine/rules/index.js`: `checkHardRules(context, options)` artık isteğe bağlı `options.activeRuleKeys` (bir `Set<rule_key>`) alıyor — verilmezse (örn. mevcut testler) tüm kurallar etkin sayılır, geriye dönük uyumluluk korunur. `lib/db/rules.js` (yeni dosya): `HARD_RULE_KEYS`/`HARD_RULE_LABELS` (6 kuralın `rule_key`'leri + Türkçe açıklamaları), `getActiveHardRuleKeys(schoolId)` (rules tablosunda satırı olmayan bir rule_key varsayılan ETKİN sayılır — yapılandırması olmayan okullarda davranış değişmez), `setHardRuleActive(schoolId, ruleKey, isActive)` (satır yoksa oluşturur, varsa günceller). `lib/db/eligibility.js` (`checkAssignmentEligibility` artık `schoolId` de alıyor, `getEligibleTeachersForZone`) ve `lib/db/bulkSchedule.js` artık `getActiveHardRuleKeys`'i bir kez çekip her `checkHardRules` çağrısına geçiriyor. **`app/(wizard)/rules/`** (yeni ekran) — "Kural Ayarları": 6 hard rule'un her biri için açıklamalı bir checkbox, aç/kapa anında kaydediliyor. `middleware.js`'e `/rules/:path*` eklendi. Tarayıcıda + SQL'den uçtan uca doğrulandı: `branch_match` kapatılınca, normalde branş uyuşmazlığı yüzünden elenecek bir öğretmen ("müzik" branşı, sadece "sınıf" izinli bir bölge) gerçekten atandı. Tam paket 108/108 yeşil.

### Bilinçli kararlar / teknik borç

- **Sadece `haftalik_yer` modu uygulandı** (kullanıcı onayıyla) — `aylik_yer`, `haftalik_gun`, `sabit` henüz kapsam dışı, ayrı bir artış gerektirir. UI'daki checkbox da sadece bu modu açıp kapatıyor.
- **Rotasyondan çıkarma, geçmişi siliyor.** `toggleTeacherRotation(teacherId, false)` `rotations` satırını tamamen siliyor (`cycle_count`/`zone_cursor` kaybolur) — tekrar dahil edilirse 0'dan başlar. "Geçici olarak durdur, kaldığı yerden devam et" gibi bir ayrım yok; bilinçli, basit tutuldu.
- **`calendar_days`'te sadece `holiday` tipi atamayı engelliyor.** `half_day`/`ceremony`/`exam` normal gün gibi işleniyor — kullanıcı onayıyla bilinçli, MEB ilkokullarında bu günlerde de nöbet/görev devam ediyor. İleride bu tiplere özel davranış (örn. yarım günde farklı slot) gerekirse ayrı bir kural dosyası olarak eklenmeli.
- **Bulk runner'ın idempotency stratejisi yıkıcı bir adımla çalışıyor**: `[startDate, endDate]` aralığındaki TÜM otomatik atamaları siler, sonra yeniden üretir. Elle düzenlenmiş (`is_manual=true`) satırlara dokunmuyor. UI'da `window.confirm()` ile açık onay var; ileride daha güçlü bir onay akışı (örn. "SİL" yazarak onaylama) gerekebilir.
- **`assignTeachersToZone` (tekil, `lib/db/scheduling.js`) hâlâ idempotent değil** — bu risk sadece toplu runner için (`generateBulkSchedule`, silme adımıyla) çözüldü, tekil fonksiyon için değil. Tekil fonksiyon şu an sadece manuel/tek seferlik düzeltmeler için kullanılıyor, düşük risk.
- **Elle atama ekleme, boş (hiç atama içermeyen) bölge sütunlarını desteklemiyor.** Tablo sütunları sadece `getAssignmentsForRange`'den dönen satırlardaki bölgelerden üretiliyor — bir bölge o aralıkta hiç atama almadıysa (örn. program hiç oluşturulmadıysa) sütun olarak görünmüyor, admin o bölgeye elle atama ekleyemiyor. Bilinçli, düşük öncelikli sınırlama.
- **`rules` tablosunda sadece `is_active` yapılandırılabiliyor.** `weight` (soft rule ağırlığı) ve `params` (kural başına parametre, örn. `max_weekly_duty` kuralının `{max: N}`'i) alanları var ama henüz hiçbir kural bunları okumuyor — 6 hard rule kendi mantığını `teachers`/`duty_zones` tablolarındaki alanlardan (örn. `allow_double_duty`) alıyor, `rules.params`'tan değil. İleride parametrik kural gerekirse (örn. "günde en fazla 2 nöbet" gibi okul bazlı özelleştirme) bu alan devreye girer.
- **`(school_id, rule_key)` üzerinde DB'de unique kısıt yok** — `setHardRuleActive` önce sorgulayıp sonra insert/update ediyor (check-then-act). Tek kullanıcılı admin toggle akışında düşük risk, ama teorik bir yarış durumu var; ihtiyaç olursa migration'a unique kısıt eklenebilir.

### Test kapsamı

- `lib/engine/`: `selectFairest.js` 5/5, `scheduler.js` 10/10, `rotation.js` 9/9, `rules/index.test.js` 6/6.
- `lib/db/`: `eligibility.test.js` 5/5, `scheduling.test.js` 2/2, `bulkSchedule.test.js` 6/6, `manualAssignment.test.js` 2/2, `rotationSchedule.test.js` 3/3, `rotationToggle.test.js` 3/3, `rules.test.js` 4/4.
- Tam paket: 108/108 yeşil.

### Sonraki adım riskleri

1. **Diğer rotasyon modları yok** (`aylik_yer`, `haftalik_gun`, `sabit`) → azaltma: her biri için ayrı bir ürün kararı + artış gerekir, `haftalik_yer`'in kurduğu Faz A/B yapısı üzerine eklenebilir.
2. **`rules.params`/`weight` kullanılmıyor** (yukarıda not edildi) → azaltma: parametrik kural veya soft rule ihtiyacı çıkınca ayrı bir artış.

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

1. ~~`rules` tablosuyla bağlantı yok~~ — **çözüldü, bkz. Faz 5 bölümü (`lib/db/rules.js` + `app/(wizard)/rules/`).**
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
