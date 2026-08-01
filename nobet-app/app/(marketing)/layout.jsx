import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './marketing.css';

// Genel (giriş gerektirmeyen) tanıtım sayfalarının ortak header/footer'ı.
// Ana sayfa (app/page.jsx) BURAYA dahil değil — kök `/` route'u zaten
// var, aynı route group'ta ikinci bir page.jsx route çakışması yaratır;
// ama Navbar/Footer artık paylaşılan bileşenler olduğu için markup
// tekrarı yok, her ikisi de aynı iki dosyayı import ediyor.

export const metadata = {
  title: 'Okullar için Otomatik Nöbet Programı',
  description: "Türkiye'deki okullar için adil, kurallara uygun ve otomatik nöbet/görev programı oluşturma sistemi.",
};

export default function MarketingLayout({ children }) {
  return (
    <div className="mkt-root">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
