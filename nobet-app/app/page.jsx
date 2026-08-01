import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Zap, Flag as FlagIcon, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/db/platformAdmin';
import { getSiteContent, getSeoMeta } from '@/lib/db/cms';
import { withDefaults } from '@/lib/data/siteContentDefaults';
import { STANDARD_YEARLY_PRICE, formatTL } from '@/lib/engine/pricing';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { CONTACT_EMAIL } from './components/contactInfo';
import Card from './components/Card';
import Button from './components/Button';
import HeroMockup from './components/HeroMockup';
import DashboardDemo from './components/DashboardDemo';
import VideoPlaceholder from './components/VideoPlaceholder';
import ProcessSteps from './components/ProcessSteps';
import FAQAccordion from './components/FAQAccordion';
import Reveal from './components/Reveal';
import DynamicLucideIcon from './components/DynamicLucideIcon';
import './(marketing)/marketing.css';
import './(marketing)/landing.css';

// SEO — Faz 2.3: seo_meta tablosundan (admin panel → SEO) besleniyor,
// hiç düzenlenmemişse layout.jsx'teki varsayılana düşer (Next.js
// generateMetadata + üst layout metadata'sını otomatik birleştirir).
export async function generateMetadata() {
  const supabase = createClient();
  const seo = await getSeoMeta(supabase, '/').catch(() => null);
  if (!seo) return {};
  return {
    title: seo.title || undefined,
    description: seo.description || undefined,
    keywords: seo.keywords || undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    robots: seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: seo.og_title || seo.title || undefined,
      description: seo.og_description || seo.description || undefined,
      images: seo.og_image ? [seo.og_image] : undefined,
    },
    twitter: seo.twitter_card ? { card: seo.twitter_card } : undefined,
  };
}

// Kök `/` route'u — (marketing) route group'un DIŞINDA (parantezli
// gruplar URL'e eklenmiyor, aynı route group içine ikinci bir page.jsx
// koymak `/` için çakışma yaratır). Navbar/Footer artık paylaşılan
// bileşenler, bu yüzden markup burada tekrar tanımlanmıyor.
//
// Hero/Özellikler/Referanslar/SSS metinleri artık site_content'ten
// (admin panel → İçerik Yönetimi) geliyor — sabit dizi kaldırıldı, bkz.
// lib/data/siteContentDefaults.js (DB boşsa fallback aynı metinler).

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

  const [heroRaw, featuresRaw, testimonialsRaw, faqRaw] = await Promise.all([
    getSiteContent(supabase, 'hero').catch(() => null),
    getSiteContent(supabase, 'features').catch(() => null),
    getSiteContent(supabase, 'testimonials').catch(() => null),
    getSiteContent(supabase, 'faq').catch(() => null),
  ]);
  const hero = withDefaults('hero', heroRaw);
  const features = withDefaults('features', featuresRaw);
  const testimonials = withDefaults('testimonials', testimonialsRaw);
  const faq = withDefaults('faq', faqRaw);
  const heroTitleLines = hero.title.split('\n');

  return (
    <div className="mkt-root">
      <Navbar />

      <main className="mkt-main">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="mkt-hero mkt-hero-split">
          <div className="mkt-hero-copy">
            <h1>{heroTitleLines.map((line, i) => (<span key={i}>{i > 0 && <br />}{line}</span>))}</h1>
            <p>{hero.subtitle}</p>
            <div className="mkt-hero-actions" style={{ justifyContent: 'flex-start' }}>
              <Button href={hero.ctaPrimaryHref} variant="primary" size="lg">{hero.ctaPrimaryLabel}</Button>
              <Link href={hero.ctaSecondaryHref} className="mkt-hero-secondary-link">{hero.ctaSecondaryLabel}</Link>
            </div>
            <div className="mkt-hero-trustbar">
              <span><ShieldCheck size={14} /> KVKK uyumlu</span>
              <span><Zap size={14} /> Kurulum gerektirmez</span>
              <span><FlagIcon size={14} /> MEB takvimiyle uyumlu</span>
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
            {features.items.map((f) => (
              <Card key={f.title}>
                <div className="mkt-icon"><DynamicLucideIcon name={f.icon} size={24} /></div>
                <h4>{f.title}</h4>
                <p>{f.description}</p>
              </Card>
            ))}
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
            {testimonials.items.map((n) => (
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
          <FAQAccordion items={faq.items} />
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
