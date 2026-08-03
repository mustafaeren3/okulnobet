import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './marketing.css';

// Genel (giriş gerektirmeyen) tanıtım sayfalarının ortak header/footer'ı.
// Ana sayfa (app/page.jsx) BURAYA dahil değil — kök `/` route'u zaten
// var, aynı route group'ta ikinci bir page.jsx route çakışması yaratır;
// ama Navbar/Footer artık paylaşılan bileşenler olduğu için markup
// tekrarı yok, her ikisi de aynı iki dosyayı import ediyor.

// Burada kasıtlı olarak metadata export'u YOK. Önceden buradaki düz
// string title ("Okullar için Otomatik Nöbet Programı"), kök layout'un
// title.template'ini bu segmentin altındaki HER sayfa için kırıyordu —
// fiyatlandirma/sss/hakkimizda/blog gibi sayfaların <title> etiketi
// "— OkulNöbet" son ekini hiç almıyordu (OG/Twitter etiketleri doğruydu,
// yalnızca gerçek <title> etkileniyordu). Artık bu segment altındaki
// TÜM sayfalar zaten kendi title/description'ını tanımlıyor
// (bkz. lib/seo/metadata.js), bu yüzden buradaki varsayılan gereksizdi
// ve kaldırıldı — kök layout'un template'i artık kesintisiz uygulanıyor.
export default function MarketingLayout({ children }) {
  return (
    <div className="mkt-root">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
