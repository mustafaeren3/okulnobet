// Tek bir schema.org nesnesini <script type="application/ld+json">
// olarak basar. `<` karakterleri <'ye kaçırılıyor — aksi halde bir
// blog yazısı başlığı/açıklaması (CMS'ten gelen serbest metin) içinde
// "</script>" geçerse script etiketi erken kapanıp ardından gelen JSON
// sayfaya düz metin olarak dökülür (ve teorik olarak script injection'a
// açılır). JSON.stringify zaten " ve \ karakterlerini kaçırıyor, tek
// eksik < kaçışı.
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
