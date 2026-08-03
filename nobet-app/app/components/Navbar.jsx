'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from './Button';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import Logo from './Logo';

const MOBILE_NAV_LINKS = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/fiyatlandirma', label: 'Fiyatlandırma' },
  { href: '/#ozellikler', label: 'Özellikler' },
  { href: '/blog', label: 'Blog' },
  { href: '/sss', label: 'SSS' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/kurumsal', label: 'İletişim' },
];

// app/page.jsx ve app/(marketing)/layout.jsx tarafından paylaşılan tek
// header. Giriş/Kayıt modallarının açık/kapalı durumu burada tutuluyor —
// iki mount noktası da aynı bileşenleri kullandığı için ayrı bir
// context'e gerek yok.
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobil menü açıkken arka plan scroll'u kilitlenir ve ESC menüyü kapatır
  // — Modal.jsx'teki aynı desen (bkz. o dosyadaki gerekçe: native <dialog>
  // yerine düz div + manuel odak/scroll yönetimi).
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  function openLogin() {
    setMobileOpen(false);
    setLoginOpen(true);
  }

  function openSignup() {
    setMobileOpen(false);
    setSignupOpen(true);
  }

  return (
    <>
      <header className={`navbar ${scrolled || mobileOpen ? 'navbar-scrolled' : ''}`}>
        <Link href="/" className="navbar-logo" onClick={closeMobile}>
          <Logo size={30} />
          <span>OkulNöbet</span>
        </Link>

        <nav className="navbar-links" aria-label="Ana menü">
          <Link href="/fiyatlandirma">Fiyatlandırma</Link>
          <Link href="/#ozellikler">Özellikler</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/sss">SSS</Link>
          <Link href="/hakkimizda">Hakkımızda</Link>
          <Link href="/kurumsal">İletişim</Link>
        </nav>

        <div className="navbar-actions">
          <Button variant="ghost" onClick={openLogin}>Giriş Yap</Button>
          <Button variant="primary" onClick={openSignup}>Ücretsiz Başla</Button>
        </div>

        <button
          type="button"
          className={`navbar-burger ${mobileOpen ? 'open' : ''}`}
          aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={mobileOpen}
          aria-controls="navbar-mobile-panel"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {/* Panel her zaman DOM'da kalır (AnimatePresence YOK — altta modallar
          için bırakılan not aynı framer-motion/AnimatePresence exit hatasına
          işaret ediyor); açık/kapalı durumu tek bir CSS class ile sürülüyor,
          böylece hem açılış hem kapanış geçişi çalışıyor ve dışarı tıklama/ESC
          state'i güncellediği an panel gerçekten kapanıyor. */}
      <div
        id="navbar-mobile-panel"
        className={`navbar-mobile ${mobileOpen ? 'open' : ''}`}
        aria-hidden={!mobileOpen}
        onClick={closeMobile}
      >
        <nav className="navbar-mobile-links" aria-label="Mobil menü" onClick={(e) => e.stopPropagation()}>
          {MOBILE_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMobile}>{link.label}</Link>
          ))}
        </nav>

        <div className="navbar-mobile-actions" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" onClick={openLogin}>Giriş Yap</Button>
          <p className="navbar-mobile-cta-hint">İlk programınızı ücretsiz oluşturun.</p>
          <Button variant="primary" onClick={openSignup}>Ücretsiz Başla</Button>
        </div>
      </div>

      {/* Kalite denetimi bulgusu: framer-motion 12.43.0'da AnimatePresence,
          bu modallardaki iç içe motion.div (backdrop + panel) yapısıyla
          exit animasyonunu HİÇBİR ZAMAN tamamlamıyor — bu da onClose()
          state'i güncellese bile (kanıtlandı: X, ESC, overlay tıklaması
          hepsi onClose'u tetikliyor) bileşenin DOM'dan asla kalkmamasına
          yol açıyordu. Modal AÇILIRKEN animasyon (initial→animate,
          bkz. Modal.jsx) bundan etkilenmiyor, sadece AnimatePresence'a
          bağlı ÇIKIŞ animasyonu etkileniyordu. Kapanmayan bir modal,
          eksik bir çıkış animasyonundan çok daha ciddi bir kırılma
          olduğu için AnimatePresence buradan kaldırıldı — modal artık
          animasyonsuz ama GÜVENİLİR şekilde kapanıyor. Aynı desenin
          Dashboard.jsx (SuccessScreen/PremiumScreen) ve Dropdown/
          FAQAccordion/PageTransition'da da kullanıldığı, onların da
          aynı riski taşıyabileceği ayrı bir takip maddesi olarak
          bildirildi (bu görevin kapsamı dışında). */}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {signupOpen && <SignupModal onClose={() => setSignupOpen(false)} />}
    </>
  );
}
