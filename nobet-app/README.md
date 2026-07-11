# Nöbet Sistemi — Okul Kayıt Akışı (Next.js + Supabase)

Bu klasör, okulların kendi hesaplarını oluşturup sisteme kaydolabildiği
ilk iskelet uygulamayı içerir. Şu an sadece kayıt/giriş akışı var —
nöbet programı arayüzü (Nobet_Sistemi.html) henüz buraya taşınmadı.

## 1) Supabase projesi kur

1. https://supabase.com üzerinden ücretsiz bir proje aç.
2. Daha önce sana verdiğim `schema.sql` dosyasını (tablolar + RLS) zaten
   çalıştırdıysan bu adımı atla. Çalıştırmadıysan önce onu çalıştır.
3. Bu klasördeki `sql/register_school_function.sql` dosyasını
   Supabase Dashboard → SQL Editor'e yapıştırıp çalıştır.
4. **Pilot testler için önemli:** Authentication → Providers → Email
   bölümünde "Confirm email" seçeneğini kapat. Açık kalırsa, kayıt
   olan kullanıcı e-postasını onaylamadan oturum açamaz ve okul kaydı
   tamamlanamaz.

## 2) Ortam değişkenlerini ayarla

`.env.local.example` dosyasını `.env.local` olarak kopyala ve
Supabase Dashboard → Project Settings → API bölümündeki bilgilerle
doldur:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3) Kur ve çalıştır

Bu klasörün içinde (Claude Code / terminal):

```
npm install
npm run dev
```

Tarayıcıda http://localhost:3000 adresini aç. Otomatik olarak
`/login` sayfasına yönlenirsin. "Okulunu kaydet" linkinden yeni bir
okul hesabı oluşturabilirsin.

## Akış nasıl işliyor

1. `/signup` sayfasında okul adı, il, ilçe, e-posta, şifre giriliyor.
2. Sunucu tarafında (`app/signup/actions.js`) önce Supabase Auth ile
   kullanıcı hesabı açılıyor.
3. Ardından `register_school` adlı güvenli veritabanı fonksiyonu
   çağrılıyor — bu fonksiyon aynı anda hem yeni okulu oluşturuyor hem
   de bu kullanıcıyı o okula "admin" olarak bağlıyor. Bu iki işlemin
   güvenli bir fonksiyon içinde yapılmasının sebebi: düz bir INSERT
   izni verilseydi, biri var olan bir okulun id'sini bulup kendini o
   okula ekleyebilirdi.
4. Kayıt sonrası `/dashboard` sayfasına yönleniyor — şu an sadece
   "Hoş geldin, [okul adı]" yazan bir iskelet sayfa.

## Sırada ne var

Nöbet_Sistemi.html'deki arayüzü (Ayarlar/Program/Dağılım sekmeleri)
bu Next.js projesine React component'leri olarak taşımak — verileri
artık `state` objesi yerine Supabase'den okuyup yazacak şekilde.
