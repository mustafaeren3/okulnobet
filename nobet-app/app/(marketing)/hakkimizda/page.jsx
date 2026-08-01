import { CONTACT_EMAIL } from '../../components/contactInfo';

export const metadata = { title: 'Hakkımızda' };

export default function HakkimizdaPage() {
  return (
    <main className="mkt-main mkt-narrow">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Hakkımızda</h1>
      </div>

      <div className="mkt-section">
        <h2>Kimiz?</h2>
        <p>
          OkulNöbet, <span className="mkt-placeholder">[DOLDURULACAK: şirket/şahıs unvanı]</span> tarafından
          geliştirilen, Türkiye'deki okullar için nöbet/görev programlarını otomatik ve adil şekilde oluşturan
          bir SaaS (hizmet olarak yazılım) ürünüdür.
        </p>
        <p>
          İletişim: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary-hover)' }}>{CONTACT_EMAIL}</a> ·{' '}
          Adres: <span className="mkt-placeholder">[DOLDURULACAK: şirket adresi]</span>
        </p>
      </div>

      <div className="mkt-section">
        <h2>Misyonumuz</h2>
        <p>
          Okul idarecilerinin saatlerini alan, hataya açık ve şeffaflıktan uzak elle nöbet dağıtımı sürecini ortadan
          kaldırmak; her öğretmenin kurallara uygun ve adil şekilde nöbete girdiği, itiraz ve yanlış anlaşılmaların
          önüne geçen bir sistem sunmak.
        </p>
      </div>

      <div className="mkt-section">
        <h2>Vizyonumuz</h2>
        <p>
          Türkiye'deki her okulun idari yükünü azaltan, günlük hayatın doğal bir parçası hâline gelmiş, güvenilir
          ve erişilebilir bir okul yönetim aracı olmak.
        </p>
      </div>

      <div className="mkt-section">
        <h2>Neden Biz?</h2>
        <div className="mkt-feature-grid">
          <div className="mkt-card">
            <h4>Türkiye'ye Özel</h4>
            <p>MEB tatil takvimi, teşkilat şeması entegrasyonu ve Türkçe arayüz ile doğrudan kullanıma hazır.</p>
          </div>
          <div className="mkt-card">
            <h4>Adil Rotasyon</h4>
            <p>Kim, ne zaman, nerede nöbet tuttu — sistem hesaplar, kimse "sırası atladı" diyemez.</p>
          </div>
          <div className="mkt-card">
            <h4>KVKK Uyumlu</h4>
            <p>Kişisel veriler yalnızca amaç için işlenir, tıbbi/özel nitelikli veri saklanmaz.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
