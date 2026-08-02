'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from './Button';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import Logo from './Logo';

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
      <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <Link href="/" className="navbar-logo">
          <Logo size={30} />
          <span>OkulNöbet</span>
        </Link>

        <nav className="navbar-links">
          <Link href="/fiyatlandirma">Fiyatlandırma</Link>
          <Link href="/#ozellikler">Özellikler</Link>
          <Link href="/sss">SSS</Link>
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
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {mobileOpen && (
        <div className="navbar-mobile">
          <Link href="/fiyatlandirma" onClick={() => setMobileOpen(false)}>Fiyatlandırma</Link>
          <Link href="/#ozellikler" onClick={() => setMobileOpen(false)}>Özellikler</Link>
          <Link href="/sss" onClick={() => setMobileOpen(false)}>SSS</Link>
          <Button variant="outline" onClick={openLogin}>Giriş Yap</Button>
          <Button variant="primary" onClick={openSignup}>Ücretsiz Başla</Button>
        </div>
      )}

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
