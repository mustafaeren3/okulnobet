# PHASE_REPORT.md

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
