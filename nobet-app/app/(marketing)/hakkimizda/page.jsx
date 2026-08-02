export const metadata = { title: 'Hakkımızda' };

export default function HakkimizdaPage() {
  return (
    <main className="mkt-main mkt-narrow">
      <header className="about-header">
        <h1>Hakkımızda</h1>
      </header>

      <section className="about-block">
        <h2>Biz Kimiz?</h2>
        <p>
          OkulNöbet, Türkiye'deki eğitim kurumlarının nöbet ve görev planlama süreçlerini kolaylaştırmak amacıyla
          geliştirilen bulut tabanlı bir yazılım platformudur.
        </p>
        <p>
          Okullarda haftalar sürebilen manuel nöbet planlama sürecini dakikalar içinde tamamlamayı hedefler.
          Öğretmenlerin görev dağılımını adil ve dengeli şekilde planlarken, yönetmeliklere uygun ve esnek bir
          yapı sunar.
        </p>
        <p>
          Platform; nöbet planlama, öğretmen yönetimi, görev dağılımı analizi ve resmi belge çıktıları gibi
          süreçleri tek bir sistem üzerinden yönetebilmeniz için tasarlanmıştır.
        </p>
        <p>
          OkulNöbet sürekli geliştirilen bir üründür. Okullardan gelen geri bildirimler doğrultusunda yeni
          özellikler düzenli olarak eklenmekte ve sistem her geçen gün daha güçlü hâle gelmektedir.
        </p>
        <p>
          Amacımız, okul yöneticilerinin zamanını alan tekrarlayan işlemleri azaltarak planlama süreçlerini
          daha hızlı, daha güvenilir ve daha şeffaf hâle getirmektir.
        </p>
      </section>

      <section className="about-block">
        <h2>Misyonumuz</h2>
        <p>
          Okullarda saatler süren nöbet planlama sürecini dakikalar içinde tamamlanabilir hâle getirerek; adil,
          şeffaf ve yönetmeliklere uygun planlamayı herkes için kolaylaştırmak.
        </p>
        <p>
          Tekrarlayan işleri otomatikleştiren, hata riskini azaltan ve okul yöneticilerine zaman kazandıran
          güvenilir yazılımlar geliştirmek.
        </p>
      </section>

      <section className="about-block">
        <h2>Vizyonumuz</h2>
        <p>
          Türkiye'deki okulların günlük yönetim süreçlerini modern teknolojilerle kolaylaştıran, güven duyulan
          ve tercih edilen okul yönetim yazılımlarından biri olmak.
        </p>
        <p>
          Nöbet planlamasından başlayarak eğitim kurumlarının zaman kazandıran dijital dönüşümüne katkı
          sağlayan yenilikçi çözümler üretmeye devam etmek.
        </p>
      </section>

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
