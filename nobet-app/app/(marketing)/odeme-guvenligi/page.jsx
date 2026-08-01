import { AlertTriangle } from 'lucide-react';
import Alert from '../../components/Alert';
import { SUPPORT_EMAIL } from '../../components/Footer';

export const metadata = { title: 'Ödeme Güvenliği' };

export default function OdemeGuvenligiPage() {
  return (
    <main className="mkt-main mkt-narrow">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Ödeme Güvenliği</h1>
      </div>

      <Alert variant="warning" className="mkt-card" style={{ marginBottom: 32, display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 700 }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Ödeme altyapımız şu anda hazırlanıyor. Bu sayfa, entegrasyon tamamlandığında hangi güvenlik
          önlemlerinin uygulanacağını açıklar; ödeme sağlayıcı seçimi kesinleşince güncellenecektir.
        </span>
      </Alert>

      <div className="mkt-section">
        <h2>Kart Bilgileriniz Bizde Saklanmaz</h2>
        <p>
          Ödeme işlemleri doğrudan lisanslı bir ödeme kuruluşu (PayTR veya iyzico) üzerinden gerçekleştirilir.
          Kredi/banka kartı numaranız, son kullanma tarihiniz ve CVV kodunuz OkulNöbet sunucularına HİÇBİR
          ZAMAN ulaşmaz veya saklanmaz — bu bilgiler yalnızca ödeme sağlayıcının PCI-DSS uyumlu, şifreli
          altyapısında işlenir.
        </p>
      </div>

      <div className="mkt-section">
        <h2>3D Secure Doğrulama</h2>
        <p>
          Tüm kart ödemeleri 3D Secure (kartınızı veren bankanın ek şifre/SMS doğrulaması) ile korunur. Bu, kart
          bilginiz çalınsa bile, sadece siz onaylamadan ödemenin tamamlanamayacağı anlamına gelir.
        </p>
      </div>

      <div className="mkt-section">
        <h2>PCI-DSS Uyumluluğu</h2>
        <p>
          Kullanacağımız ödeme sağlayıcılar (PayTR/iyzico), kart verilerinin işlenmesinde uluslararası PCI-DSS
          güvenlik standardına sahiptir.
        </p>
      </div>

      <div className="mkt-section">
        <h2>Fatura ve İade</h2>
        <p>
          Her ödeme sonrası e-posta adresinize bir fatura/dekont gönderilir. İade taleplerinde{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--primary-hover)' }}>{SUPPORT_EMAIL}</a> ile iletişime geçebilirsiniz.
        </p>
      </div>
    </main>
  );
}
