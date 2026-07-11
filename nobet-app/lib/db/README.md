# lib/db

Veritabanına dokunan tüm sorgu fonksiyonları buraya gelecek (Faz 2+).
Component/page dosyaları Supabase'e doğrudan değil, bu katman üzerinden erişmeli.

Şu an boş: mevcut sorgular hâlâ `app/(panel)/dashboard/actions.js`,
`app/(panel)/dashboard/page.jsx` ve `Dashboard.jsx` içinde doğrudan
`lib/supabase/{client,server}` ile yapılıyor (bkz. PHASE_REPORT.md — teknik borç).
