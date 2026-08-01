import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Repeat2, Scale, Flag, Printer, ShieldCheck, Zap, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/db/platformAdmin';
import { STANDARD_YEARLY_PRICE, formatTL } from '@/lib/engine/pricing';
import Navbar from './components/Navbar';
import Footer, { CONTACT_EMAIL } from './components/Footer';
import Card from './components/Card';
import Button from './components/Button';
import HeroMockup from './components/HeroMockup';
import DashboardDemo from './components/DashboardDemo';
import VideoPlaceholder from './components/VideoPlaceholder';
import ProcessSteps from './components/ProcessSteps';
import FAQAccordion from './components/FAQAccordion';
import Reveal from './components/Reveal';
import './(marketing)/marketing.css';
import './(marketing)/landing.css';

// Kök `/` route'u — (marketing) route group'un DIŞINDA (parantezli
// gruplar URL'e eklenmiyor, aynı route group içine ikinci bir page.jsx
// koymak `/` için çakışma yaratır). Navbar/Footer artık paylaşılan
// bileşenler, bu yüzden markup burada tekrar tanımlanmıyor.

const PILOT_NOTES = [
  {
    role: 'Müdür Yardımcısı, Devlet Okulu',
    quote: 'Nöbet çizelgesini her ay elle hazırlamak saatler alıyordu; birkaç dakikada bitmesi büyük fark yaratıyor.',
  },
  {
    role: 'Okul Müdürü',
    quote: 'Kimin ne zaman nöbet tuttuğu artık şeffaf — kimse sırasının atlandığını iddia edemiyor.',
  },
  {
    role: 'Nöbetçi Öğretmen',
    quote: 'Programı telefonumdan görebiliyorum, kağıt liste asılmasını beklemem gerekmiyor.',
  },
];

const FAQS = [
  {
    q: 'OkulNöbet tam olarak ne yapıyor?',
    a: 'Okulundaki öğretmen ve nöbet bölgelerini tanımlıyorsun; sistem, belirlediğin kurallara (branş, gün kısıtı, çift nöbet vb.) uyarak ve adil bir rotasyonla otomatik nöbet programı üretiyor. Elle düzenleme ve kilitleme her zaman mümkün.',
  },
  {
    q: 'Ücretsiz deneme var mı?',
    a: 'Süre sınırı yok — ücretsiz kaydolup okulunu kurabilir, tüm dönem için programı üretebilirsin. Ücretsiz planda üretilen programın yalnızca ilk ayı görüntülenebilir ve okul toplam 1 kez tam program üretebilir.',
  },
  {
    q: 'Fiyat nasıl belirleniyor?',
    a: 'Standart plan sabit bir yıllık fiyattır, öğretmen sayısından bağımsızdır. Güncel fiyatı Fiyatlandırma sayfasında görebilirsin.',
  },
  {
    q: 'Verilerimiz güvende mi?',
    a: 'Her okulun verisi diğer okullardan tamamen izole tutulur (satır seviyesi güvenlik). Detaylar için Gizlilik Politikası sayfasına bakabilirsin.',
  },
  {
    q: 'Aboneliğimi iptal edebilir miyim?',
    a: 'Evet, istediğin zaman iptal edebilirsin. İptal sonrası mevcut fatura döneminin sonuna kadar kullanıma devam edebilirsin.',
  },
];

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Platform admin hiçbir koşulda /dashboard'a düşmemeli (o rota okul
    // sahibi kullanıcılar için — süper admin'in bağlı bir okulu yok,
    // "Henüz bir okula bağlı değilsin" ekranıyla karşılaşırdı). Tek
    // kaynak: platform_admins/platform_is_admin() (bkz. lib/db/platformAdmin.js) —
    // aynı kontrol app/(auth)/login/actions.js ve dashboard/page.jsx'te de kullanılıyor.
    const isAdmin = await isPlatformAdmin(supabase).catch(() => false);
    redirect(isAdmin ? '/super-admin' : '/dashboard');
  }

  return (
    <div className="mkt-root">
      <Navbar />

      <main className="mkt-main">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="mkt-hero mkt-hero-split">
          <div className="mkt-hero-copy">
            <h1>OkulNöbet ile Programınızı<br />Dakikalar İçinde Oluşturun</h1>
            <p>
              Okullar için otomatik nöbet planlama, adil dağıtım, MEB takvimi, tek tıkla PDF çıktısı.
            </p>
            <div className="mkt-hero-actions" style={{ justifyContent: 'flex-start' }}>
              <Button href="/signup" variant="primary" size="lg">Ücretsiz Başla</Button>
              <Link href="/fiyatlandirma" className="mkt-hero-secondary-link">Fiyatlandırmayı gör →</Link>
            </div>
            <div className="mkt-hero-trustbar">
              <span><ShieldCheck size={14} /> KVKK uyumlu</span>
              <span><Zap size={14} /> Kurulum gerektirmez</span>
              <span><Flag size={14} /> MEB takvimiyle uyumlu</span>
            </div>
          </div>
          <div className="mkt-hero-visual">
            <HeroMockup />
          </div>
        </div>

        {/* ── DASHBOARD DEMO ───────────────────────────────────── */}
        <Reveal className="mkt-section mkt-demo-section">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">Ürünün İçinden</span>
            <h2>Gerçek Zamanlı Nöbet Programı</h2>
            <p className="mkt-section-sub">Öğretmenlerini ve nöbet bölgelerini tanımla — geri kalanını motor hesaplar.</p>
          </div>
          <DashboardDemo />
        </Reveal>

        {/* ── VIDEO ────────────────────────────────────────────── */}
        <Reveal className="mkt-section mkt-narrow-section">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">2 Dakikada Anlat</span>
            <h2>Nasıl Çalıştığını İzle</h2>
          </div>
          <VideoPlaceholder />
        </Reveal>

        {/* ── SÜREÇ ────────────────────────────────────────────── */}
        <Reveal className="mkt-section">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">Nasıl Çalışır</span>
            <h2>Dört Adımda Kurulum</h2>
          </div>
          <ProcessSteps />
        </Reveal>

        {/* ── ÖZELLİKLER ───────────────────────────────────────── */}
        <Reveal className="mkt-section" id="ozellikler">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">Neden OkulNöbet</span>
            <h2>Elle Yapmanın Tüm Zahmetini Ortadan Kaldırır</h2>
          </div>
          <div className="mkt-feature-grid">
            <Card>
              <div className="mkt-icon"><Repeat2 size={24} /></div>
              <h4>Otomatik Rotasyon</h4>
              <p>Haftalık veya aylık dönme düzeni ile her öğretmen sırayla, adil şekilde nöbet tutar.</p>
            </Card>
            <Card>
              <div className="mkt-icon"><Scale size={24} /></div>
              <h4>Kurallara Uygun</h4>
              <p>Branş, gün kısıtı, izin/rapor ve çift nöbet kuralları otomatik uygulanır.</p>
            </Card>
            <Card>
              <div className="mkt-icon"><Flag size={24} /></div>
              <h4>MEB Tatil Takvimi</h4>
              <p>Resmi tatiller tek tuşla yüklenir, nöbet sırası tatillerde ilerlemez.</p>
            </Card>
            <Card>
              <div className="mkt-icon"><Printer size={24} /></div>
              <h4>Resmi Evrak Çıktısı</h4>
              <p>İmza bölümlü, yazdırmaya hazır nöbet çizelgesi oluştur.</p>
            </Card>
          </div>
        </Reveal>

        {/* ── OKUL İDARECİLERİ İÇİN ────────────────────────────── */}
        <Reveal className="mkt-section">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">Okul İdarecileri İçin</span>
            <h2>Ürünü Şekillendiren İhtiyaçlar</h2>
            <p className="mkt-section-sub">Gerçek müşteri yorumu yerine, ürünü tasarlarken yol gösterici olan tipik ihtiyaçları paylaşıyoruz.</p>
          </div>
          <div className="mkt-pilot-grid">
            {PILOT_NOTES.map((n) => (
              <Card key={n.role} className="mkt-pilot-card">
                <p>&ldquo;{n.quote}&rdquo;</p>
                <div className="mkt-pilot-role">{n.role}</div>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* ── FİYATLANDIRMA ────────────────────────────────────── */}
        <Reveal className="mkt-section">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">Fiyatlandırma</span>
            <h2>Basit, Şeffaf Fiyatlandırma</h2>
          </div>
          <div className="mkt-pricing-grid">
            <Card className="mkt-pricing-card">
              <div className="mkt-tier-label">Ücretsiz</div>
              <div className="mkt-price">0 ₺</div>
              <div className="mkt-price-sub">ilk ayı görüntüle</div>
            </Card>
            <Card className="mkt-pricing-card mkt-pricing-highlight">
              <div className="mkt-pricing-badge">En Popüler</div>
              <div className="mkt-tier-label">Standart</div>
              <div className="mkt-price">{formatTL(STANDARD_YEARLY_PRICE)}</div>
              <div className="mkt-price-sub">/ yıl</div>
            </Card>
            <Card className="mkt-pricing-card">
              <div className="mkt-tier-label"><Building2 size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Kurumsal</div>
              <div className="mkt-price" style={{ fontSize: 22 }}>Teklif Al</div>
              <div className="mkt-price-sub">okul grupları</div>
            </Card>
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Button href="/fiyatlandirma" variant="outline">Tüm Planları Gör</Button>
          </div>
        </Reveal>

        {/* ── SSS ──────────────────────────────────────────────── */}
        <Reveal className="mkt-section mkt-narrow-section">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">Merak Edilenler</span>
            <h2>Sık Sorulan Sorular</h2>
          </div>
          <FAQAccordion items={FAQS} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/sss" className="mkt-hero-secondary-link">Tüm soruları gör →</Link>
          </div>
        </Reveal>

        {/* ── KAPANIŞ CTA ──────────────────────────────────────── */}
        <Reveal className="mkt-cta-banner">
          <h2>Nöbet Programını Bugün Oluştur</h2>
          <p>Kurulum gerektirmez, kredi kartı istemez — birkaç dakikada okulunu kaydet.</p>
          <Button href="/signup" variant="primary" size="lg">Ücretsiz Başla</Button>
          <div className="mkt-cta-banner-contact">
            Sorularının cevabını bulamadın mı? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
