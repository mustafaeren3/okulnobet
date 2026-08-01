import { SUPPORT_EMAIL } from '../../components/contactInfo';

export const metadata = { title: 'Sık Sorulan Sorular' };

const FAQS = [
  {
    q: 'OkulNöbet tam olarak ne yapıyor?',
    a: 'Okulundaki öğretmen ve nöbet bölgelerini tanımlıyorsun; sistem, belirlediğin kurallara (branş, gün kısıtı, çift nöbet vb.) uyarak ve adil bir rotasyonla otomatik nöbet programı üretiyor. Elle düzenleme ve kilitleme her zaman mümkün.',
  },
  {
    q: 'Ücretsiz deneme var mı?',
    a: 'Süre sınırı yok — ücretsiz kaydolup okulunu kurabilir, tüm dönem için programı üretebilirsin. Ücretsiz planda üretilen programın yalnızca ilk ayı görüntülenebilir ve okul TOPLAM 1 kez tam program üretebilir; her e-posta ve telefon numarasıyla yalnızca bir kez ücretsiz hesap açılabilir.',
  },
  {
    q: 'Fiyat nasıl belirleniyor?',
    a: 'Standart plan sabit bir yıllık fiyattır, öğretmen sayısından bağımsızdır. Güncel fiyatı Fiyatlandırma sayfasında görebilirsin.',
  },
  {
    q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
    a: 'Ödeme altyapımız şu anda hazırlanıyor (PayTR/iyzico üzerinden 3D Secure ile kredi/banka kartı). Ödeme entegrasyonu yayına alındığında burada ve Ödeme Güvenliği sayfasında duyurulacak.',
  },
  {
    q: 'Verilerimiz güvende mi?',
    a: 'Her okulun verisi diğer okullardan tamamen izole tutulur (satır seviyesi güvenlik). Detaylar için Gizlilik Politikası sayfasına bakabilirsin.',
  },
  {
    q: 'Aboneliğimi iptal edebilir miyim?',
    a: 'Evet, istediğin zaman iptal edebilirsin. İptal sonrası mevcut fatura döneminin sonuna kadar kullanıma devam edebilirsin.',
  },
  {
    q: 'Teknik destek nasıl alırım?',
    a: <span><a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--primary-hover)' }}>{SUPPORT_EMAIL}</a> üzerinden bize ulaşabilirsin.</span>,
  },
];

export default function SssPage() {
  return (
    <main className="mkt-main mkt-narrow">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Sık Sorulan Sorular</h1>
      </div>
      <div className="mkt-section" style={{ marginTop: 0 }}>
        {FAQS.map((item) => (
          <div className="mkt-faq-item" key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
