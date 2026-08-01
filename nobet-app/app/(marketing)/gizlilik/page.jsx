import { CONTACT_EMAIL } from '../../components/Footer';

export const metadata = { title: 'Gizlilik Politikası' };

export default function GizlilikPage() {
  return (
    <main className="mkt-main mkt-narrow">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Gizlilik Politikası</h1>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Son güncelleme: <span className="mkt-placeholder">[DOLDURULACAK: tarih]</span></p>

      <div className="mkt-section">
        <h2>1. Veri Sorumlusu</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu:{' '}
          <span className="mkt-placeholder">[DOLDURULACAK: şirket/şahıs unvanı, adres]</span>,{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary-hover)' }}>{CONTACT_EMAIL}</a>.
        </p>
      </div>

      <div className="mkt-section">
        <h2>2. Toplanan Veriler</h2>
        <p>Hizmeti kullanırken şu verileri işliyoruz:</p>
        <ul>
          <li><strong>Hesap bilgileri:</strong> okul idarecisinin e-posta adresi, telefon numarası, şifre (şifrelenmiş olarak saklanır).</li>
          <li><strong>Okul bilgileri:</strong> okul adı, il/ilçe, öğretmen ad-soyad ve branş bilgileri, nöbet bölgeleri.</li>
          <li><strong>Kullanım verisi:</strong> oluşturulan nöbet programları, sayfa/özellik kullanım logları.</li>
          <li><strong>Ödeme verisi:</strong> ödeme kartı bilgileri bizim sunucularımızda SAKLANMAZ — ödeme sağlayıcı (PayTR/iyzico) üzerinden, 3D Secure ile doğrudan işlenir (bkz. Ödeme Güvenliği).</li>
        </ul>
      </div>

      <div className="mkt-section">
        <h2>3. Özel Nitelikli Veriler</h2>
        <p>
          Öğretmenlerin izin/rapor gibi istisna kayıtlarında yalnızca "bu tarih aralığında muaf" bilgisi tutulur;
          tıbbi teşhis, sağlık durumu gibi özel nitelikli kişisel veri SİSTEME KAYDEDİLMEZ.
        </p>
      </div>

      <div className="mkt-section">
        <h2>4. Verilerin Kullanım Amacı</h2>
        <ul>
          <li>Nöbet programı oluşturma hizmetini sunmak,</li>
          <li>Hesap ve abonelik yönetimi,</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi,</li>
          <li>Hizmet kalitesinin iyileştirilmesi.</li>
        </ul>
      </div>

      <div className="mkt-section">
        <h2>5. Veri Paylaşımı</h2>
        <p>
          Verileriniz, hizmetin sunulması için gerekli olan alt yükleniciler (barındırma/veritabanı sağlayıcısı,
          ödeme sağlayıcısı) dışında üçüncü taraflarla paylaşılmaz, satılmaz veya kiralanmaz.
        </p>
      </div>

      <div className="mkt-section">
        <h2>6. Veri Güvenliği</h2>
        <p>
          Her okulun verisi satır seviyesi güvenlik (Row Level Security) ile diğer okullardan tamamen izole
          tutulur — bir okul idarecisi başka bir okulun verisine hiçbir şekilde erişemez.
        </p>
      </div>

      <div className="mkt-section">
        <h2>7. KVKK Kapsamındaki Haklarınız</h2>
        <p>
          KVKK'nın 11. maddesi uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna
          ilişkin bilgi talep etme, düzeltilmesini veya silinmesini isteme haklarına sahipsiniz. Taleplerinizi{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary-hover)' }}>{CONTACT_EMAIL}</a> adresine iletebilirsiniz.
        </p>
      </div>

      <div className="mkt-section">
        <h2>8. Çerezler</h2>
        <p>
          Sistem, oturum yönetimi için zorunlu çerezler kullanır; pazarlama/izleme amaçlı üçüncü taraf çerezi
          kullanılmaz.
        </p>
      </div>
    </main>
  );
}
