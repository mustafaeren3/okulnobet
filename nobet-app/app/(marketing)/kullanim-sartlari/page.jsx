export const metadata = { title: 'Kullanım Şartları — Nöbet Sistemi' };

export default function KullanimSartlariPage() {
  return (
    <main className="mkt-main mkt-narrow">
      <div className="mkt-hero" style={{ padding: '20px 0 8px' }}>
        <h1>Kullanım Şartları</h1>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Son güncelleme: <span className="mkt-placeholder">[DOLDURULACAK: tarih]</span></p>

      <div className="mkt-section">
        <h2>1. Taraflar ve Kabul</h2>
        <p>
          Bu şartlar, <span className="mkt-placeholder">[DOLDURULACAK: şirket/şahıs unvanı]</span> ("Hizmet Sağlayıcı")
          tarafından sunulan Nöbet Sistemi hizmetini ("Hizmet") kullanan okul idarecisi ("Kullanıcı") arasındaki
          ilişkiyi düzenler. Hizmete kaydolarak bu şartları kabul etmiş sayılırsınız.
        </p>
      </div>

      <div className="mkt-section">
        <h2>2. Hizmetin Kapsamı</h2>
        <p>
          Hizmet, okulların nöbet/görev programlarını otomatik oluşturmasına yardımcı bir yazılım aracıdır.
          Üretilen programın nihai doğruluğunun ve okul mevzuatına uygunluğunun kontrolü Kullanıcı'nın
          sorumluluğundadır.
        </p>
      </div>

      <div className="mkt-section">
        <h2>3. Deneme Süresi ve Abonelik</h2>
        <ul>
          <li>Yeni kayıtlar 14 gün ücretsiz deneme hakkına sahiptir.</li>
          <li>Her e-posta adresi ve telefon numarası yalnızca BİR KEZ deneme hesabı açabilir; aynı kişinin
            birden fazla e-posta ile tekrar deneme oluşturması engellenir.</li>
          <li>Deneme süresi boyunca tek seferde en fazla ~1 aylık bir program üretilebilir.</li>
          <li>Deneme süresi sonunda hizmete devam etmek için ücretli bir plana geçilmesi gerekir.</li>
          <li>Fiyatlandırma, okulun aktif öğretmen sayısına göre otomatik belirlenir (bkz. Fiyatlandırma sayfası).</li>
        </ul>
      </div>

      <div className="mkt-section">
        <h2>4. Kullanıcı Yükümlülükleri</h2>
        <ul>
          <li>Hesap bilgilerinin (e-posta, şifre) gizliliğinden Kullanıcı sorumludur.</li>
          <li>Hizmet yalnızca meşru okul idaresi amacıyla, gerçek verilerle kullanılabilir.</li>
          <li>Sisteme kasıtlı olarak zarar verecek, aşırı yük bindirecek veya güvenliği aşmaya yönelik
            faaliyetler yasaktır.</li>
        </ul>
      </div>

      <div className="mkt-section">
        <h2>5. Ödeme ve İptal</h2>
        <p>
          Ödemeler, üçüncü taraf ödeme sağlayıcıları (PayTR/iyzico) üzerinden 3D Secure ile alınır. Kullanıcı
          aboneliğini istediği zaman iptal edebilir; iptal, mevcut fatura döneminin sonunda yürürlüğe girer.
          İade politikası: <span className="mkt-placeholder">[DOLDURULACAK]</span>.
        </p>
      </div>

      <div className="mkt-section">
        <h2>6. Sorumluluğun Sınırlandırılması</h2>
        <p>
          Hizmet Sağlayıcı, Hizmet'in kesintisiz veya hatasız çalışacağını garanti etmez. Hizmet Sağlayıcı,
          Hizmet'in kullanımından doğan dolaylı zararlardan sorumlu tutulamaz.
        </p>
      </div>

      <div className="mkt-section">
        <h2>7. Değişiklikler</h2>
        <p>
          Bu şartlar zaman zaman güncellenebilir. Önemli değişiklikler kayıtlı e-posta adresine bildirilir.
        </p>
      </div>

      <div className="mkt-section">
        <h2>8. İletişim</h2>
        <p>
          Sorularınız için: <span className="mkt-placeholder">[DOLDURULACAK: iletişim e-postası]</span>
        </p>
      </div>
    </main>
  );
}
