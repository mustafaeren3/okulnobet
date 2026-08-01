import { createClient } from '@/lib/supabase/server';
import { getSiteContent, getSeoMeta } from '@/lib/db/cms';

export async function generateMetadata() {
  const supabase = createClient();
  const seo = await getSeoMeta(supabase, '/cerez-politikasi').catch(() => null);
  return { title: seo?.title || 'Çerez Politikası', description: seo?.description || undefined };
}

// Yeni sayfa (Faz 2.3) — tamamen İçerik Yönetimi'nden besleniyor, admin
// panelden hiç düzenlenmemişse aşağıdaki genel varsayılan metin gösterilir.
export default async function CerezPolitikasiPage() {
  const supabase = createClient();
  const content = await getSiteContent(supabase, 'legal_cookies').catch(() => null);

  return (
    <main className="mkt-main mkt-narrow">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Çerez Politikası</h1>
      </div>
      {content?.bodyHtml ? (
        <div className="mkt-section" dangerouslySetInnerHTML={{ __html: content.bodyHtml }} />
      ) : (
        <div className="mkt-section">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Son güncelleme: <span className="mkt-placeholder">[DOLDURULACAK: tarih]</span></p>
          <h2>1. Çerez Nedir?</h2>
          <p>Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır.</p>
          <h2>2. Kullandığımız Çerezler</h2>
          <ul>
            <li><strong>Zorunlu çerezler:</strong> oturum açma/kimlik doğrulama için gereklidir, kapatılamaz.</li>
            <li><strong>Analitik çerezler:</strong> (varsa) site kullanımını anlamak için, İçerik Yönetimi → Genel Ayarlar'da tanımlı Google Analytics/Clarity gibi araçlar üzerinden.</li>
          </ul>
          <h2>3. Çerezleri Yönetme</h2>
          <p>Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz; zorunlu çerezleri engellemek hizmetin çalışmasını etkileyebilir.</p>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 24 }}>Bu metin, İçerik Yönetimi panelinden özelleştirilebilir bir varsayılandır.</p>
        </div>
      )}
    </main>
  );
}
