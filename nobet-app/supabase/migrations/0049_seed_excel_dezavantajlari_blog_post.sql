-- Yeni blog yazısı: "Excel ile Nöbet Çizelgesi Hazırlamanın 7 Dezavantajı"
-- (/blog/excel-ile-nobet-cizelgesi-hazirlamanin-7-dezavantaji). content/faq dolar-tırnaklama ($article$...$article$)
-- ile ekleniyor — bkz. migration 0048'deki aynı desen/gerekçe.
insert into public.blog_posts (
  slug, title, excerpt, content, status, category, tags,
  meta_title, meta_description, faq, published_at
) values (
  'excel-ile-nobet-cizelgesi-hazirlamanin-7-dezavantaji',
  'Excel ile Nöbet Çizelgesi Hazırlamanın 7 Dezavantajı',
  $excerpt$Excel ile nöbet çizelgesi hazırlarken karşılaşılan 7 temel dezavantajı gerçek okul örnekleriyle inceliyor, daha verimli bir alternatifi anlatıyoruz.$excerpt$,
  $article$<p>Bir devlet ortaokulunda müdür yardımcısı olan bir tanıdığım, her eylül ayı başında aynı dosyayı açar: "nobet_2024_SON_kesin_v3.xlsx". Dosya adındaki "SON" ve "kesin" kelimeleri aslında bir itirafın parçasıdır — bu dosyanın daha önce en az iki kez "son" olduğu iddia edilmiş, ikisinde de yeniden açılıp düzeltilmek zorunda kalınmıştır. Excel'de nöbet çizelgesi hazırlayan hemen her okul idarecisi bu senaryoyu bir şekilde tanır.</p>

<p>Excel, Türkiye'deki okullarda nöbet çizelgesi hazırlamak için onlarca yıldır kullanılan varsayılan araçtır. Bunun iyi bir nedeni var: hemen her bilgisayarda kurulu, kimse için yabancı değil ve bir tablo çizmek kadar basit görünüyor. Ama <strong>Excel ile nöbet çizelgesi hazırlamanın dezavantajları</strong>, öğretmen sayısı 30'u, bölge sayısı 6-7'yi geçtiği anda kendini göstermeye başlıyor. Bu yazıda, Excel'in neden hâlâ tercih edildiğini ve aynı zamanda neden günümüz okul yönetimi ihtiyaçları için yetersiz kaldığını, gerçek okul senaryolarıyla birlikte ele alıyoruz.</p>
<p>Bu yazı Excel'i kullanmayı bırakmanız gerektiğini söylemiyor; öğretmen nöbet çizelgesi hazırlarken karşılaşılan yedi somut dezavantajı, okul yönetimi pratiğinden gerçek örneklerle göstermeyi amaçlıyor. Hangi noktada "artık bu şekilde devam edemeyiz" dendiğine siz karar vereceksiniz.</p>

<div class="mkt-card" style="margin: 24px 0;">
  <p style="margin: 0 0 10px; font-weight: 700; color: var(--text);">İçindekiler</p>
  <ol style="margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: 14px;">
    <li><a href="#excel-neden-tercih">Excel Hâlâ Neden Tercih Ediliyor?</a></li>
    <li><a href="#dezavantaj-1">1. Dezavantaj — Çok Fazla Manuel İşlem Gerektirir</a></li>
    <li><a href="#dezavantaj-2">2. Dezavantaj — Adil Nöbet Dağılımını Takip Etmek Zordur</a></li>
    <li><a href="#dezavantaj-3">3. Dezavantaj — Küçük Değişiklikler Tüm Tabloyu Bozabilir</a></li>
    <li><a href="#dezavantaj-4">4. Dezavantaj — Hata Yapma İhtimali Yüksektir</a></li>
    <li><a href="#dezavantaj-5">5. Dezavantaj — Geçmiş Nöbetleri Analiz Etmek Zordur</a></li>
    <li><a href="#dezavantaj-6">6. Dezavantaj — Resmî Word Çıktısı Hazırlamak Zaman Alır</a></li>
    <li><a href="#dezavantaj-7">7. Dezavantaj — Öğretmen Sayısı Arttıkça Yönetilemez Hâle Gelir</a></li>
    <li><a href="#gercek-ornekler">Gerçek Okul Örnekleri</a></li>
    <li><a href="#excel-yerine">Excel Yerine Nasıl Daha Verimli Çalışılabilir?</a></li>
    <li><a href="#sss">Sık Sorulan Sorular</a></li>
  </ol>
</div>

<h2 id="excel-neden-tercih">Excel Hâlâ Neden Tercih Ediliyor?</h2>
<p>Excel'in okul idarelerinde bu kadar yaygın olmasının nedeni aslında basit: ek bir maliyet gerektirmiyor, kurulum istemiyor ve neredeyse her müdür yardımcısı temel düzeyde kullanmayı biliyor. Bir tabloya öğretmen isimlerini, yan tarafa günleri yazıp hücreleri doldurmak, ilk bakışta nöbet planlamasının tamamı gibi görünüyor.</p>
<p>Küçük bir okulda — örneğin 15-20 öğretmenli bir ilkokulda — bu gerçekten de yeterli olabilir. Sorun, okul büyüdükçe, bölge sayısı arttıkça ve "adil dağılım" beklentisi somutlaştıkça ortaya çıkıyor. Excel bir hesaplama programıdır, ama nöbet planlaması aslında bir <em>kural motoru</em> gerektirir: kim, ne zaman, hangi bölgede, hangi kısıtlarla nöbet tutabilir sorusuna otomatik cevap veren bir sistem. Excel bu soruyu sizin yerinize cevaplamaz; siz her hücreyi elle doldurup elle kontrol etmek zorunda kalırsınız.</p>
<p>Bir diğer neden de alışkanlık. Yıllardır aynı yöntemle çizelge hazırlayan bir idareci, "bugüne kadar bir şekilde idare ettik" diyerek değişikliğe sıcak bakmayabilir. Bu bakış açısı anlaşılır — ama genellikle "idare ettik" ifadesinin arkasında, her dönem tekrarlanan, sessizce kabullenilmiş bir yorgunluk saklıdır. Aşağıdaki yedi madde, bu yorgunluğun nereden geldiğini tek tek açıklıyor.</p>

<div class="alert alert-info" style="margin: 20px 0;"><strong>Not:</strong> Bu yazının amacı Excel'i kötülemek değil. Küçük ölçekli ve dikkatli kullanıldığında Excel işe yarar. Amaç, öğretmen sayısı arttığında hangi noktalarda zorlandığını somut örneklerle göstermek.</div>

<h2 id="dezavantaj-1">1. Dezavantaj — Çok Fazla Manuel İşlem Gerektirir</h2>
<p>Bir nöbet çizelgesi tek seferlik bir belge değildir; dönem boyunca sürekli güncellenen canlı bir dokümandır. Yeni bir öğretmen geldiğinde, biri ayrıldığında, biri rapor aldığında, tatil takvimi değiştiğinde — her biri elle yapılan bir dizi işlemi tetikler: doğru hücreyi bulmak, ismi silmek veya eklemek, renklendirmeyi güncellemek, alttaki "kim kaç kez nöbet tuttu" özetini elle yeniden hesaplamak.</p>
<p>40 öğretmenli bir lisede bir dönem boyunca ortalama kaç kez böyle bir güncelleme yapıldığını sorduğumuzda aldığımız cevap şaşırtıcıydı: bir müdür yardımcısı, yalnızca ekim-aralık ayları arasında 23 kez çizelgeyi elden geçirdiğini söyledi — bunların çoğu tek bir öğretmenin izin gününü işlemek içindi, ama her seferinde ilgili haftanın tamamını gözden geçirmek gerekiyordu.</p>
<p>Bu, sistemin doğasından kaynaklanan bir sorun: Excel'de hücreler birbirinden bağımsızdır ve bir değişikliğin çizelgenin geri kalanını nasıl etkilediğini size otomatik olarak söylemez. Her manuel işlem, potansiyel bir yeni hata demektir — ve bu işlemlerin sayısı, dönem uzadıkça ve öğretmen sayısı arttıkça azalmıyor, tam tersine birikiyor.</p>

<h2 id="dezavantaj-2">2. Dezavantaj — Adil Nöbet Dağılımını Takip Etmek Zordur</h2>
<p>Öğretmenler arasında en sık yaşanan anlaşmazlık konusu nöbetin adil dağıtılıp dağıtılmadığıdır. Bu konuda somut veri sunamayan bir idareci, "bana güvenin, adil dağıtıyorum" demekten başka bir şey yapamaz — ki bu, kalabalık bir öğretmenler odasında yeterli bir cevap değildir.</p>
<h3>Hangi Bilgiler Takip Edilmeli?</h3>
<p>Adil bir dağılım iddia edebilmek için en az şu bilgilerin güncel tutulması gerekir: her öğretmenin toplam nöbet sayısı, hangi bölgelerde kaçar kez nöbet tuttuğu, aynı haftada birden fazla nöbete denk gelip gelmediği ve son nöbetinin üzerinden ne kadar süre geçtiği. Excel'de bu bilgiler genellikle ayrı bir sekmede, elle güncellenen bir sayım tablosu olarak tutulur.</p>
<p>Sorun şu ki, bu ikinci tablo ana çizelgeyle otomatik bağlantılı değildir. Ana çizelgede bir değişiklik yapıldığında, sayım tablosunun da elle güncellenmesi gerekir — ve pratikte bu ikisi zamanla birbirinden kopar. Bir müdür yardımcısının kendi ifadesiyle: "Sayım tablosunu üç ay güncellemeyi unuttum, sonra kimin kaç nöbet tuttuğunu baştan saymak zorunda kaldım."</p>

<table>
  <thead><tr><th></th><th>Excel</th><th>OkulNöbet</th></tr></thead>
  <tbody>
    <tr><td>Nöbet sayımı</td><td>Ayrı sekme, elle güncellenir</td><td>Sistem otomatik tutar</td></tr>
    <tr><td>Aynı bölge tekrarı kontrolü</td><td>Gözle kontrol edilir</td><td>Otomatik uygulanır</td></tr>
    <tr><td>Dağılım itirazına somut cevap</td><td>Hafızaya veya notlara bağlı</td><td>Geçmiş kayıtlardan anında görülür</td></tr>
  </tbody>
</table>

<h2 id="dezavantaj-3">3. Dezavantaj — Küçük Değişiklikler Tüm Tabloyu Bozabilir</h2>
<p>Excel'de bir satır eklemek, bir sütunu genişletmek ya da bir hücreyi kopyala-yapıştır yapmak, göründüğünden daha risklidir. Formül içeren hücreler kayabilir, koşullu biçimlendirme (renklendirme) kuralları referans aldığı hücre değişince bozulabilir, birleştirilmiş hücreler bir satır eklendiğinde beklenmedik şekilde kayabilir.</p>
<p>Bunun tipik bir örneği şudur: bir öğretmen dönem ortasında ayrılır, idareci o öğretmenin satırını siler. Silme işlemi, o satıra bağlı bir koşullu biçimlendirme kuralını (örneğin "bu hücre doluysa kırmızı yap") bozar ve bir anda tüm tablodaki renklendirme mantığı anlamsızlaşır. Idareci bunu genellikle çizelge yazdırılıp asıldıktan sonra, birileri "bu renkler ne anlama geliyor" diye sorunca fark eder.</p>
<p>Benzer bir risk, dosyanın farklı bilgisayarlarda açılmasında da ortaya çıkıyor. Bir bilgisayarda düzgün görünen sütun genişlikleri, farklı bir Excel sürümünde veya farklı bir ekran çözünürlüğünde kaymış olarak açılabiliyor. Böyle durumlarda idareci, kendi bilgisayarında doğru gördüğü bir tabloyu, başka biri açtığında bozuk halde görebiliyor — ve bu genellikle en uygunsuz zamanda, örneğin dosya yazdırılmak üzere başka bir bilgisayara aktarıldığında fark ediliyor.</p>

<div class="alert alert-warning" style="margin: 20px 0;"><strong>Dikkat:</strong> Paylaşılan bir Excel dosyasında birden fazla kişi (müdür yardımcısı, zümre başkanı gibi) aynı anda düzenleme yapıyorsa, kimin hangi değişikliği ne zaman yaptığını takip etmek neredeyse imkansız hâle gelir. "Hangisi son hâli" sorusu, dönem sonunda sık sorulan bir soru olur.</div>

<h2 id="dezavantaj-4">4. Dezavantaj — Hata Yapma İhtimali Yüksektir</h2>
<p>Excel'de nöbet çizelgesi hazırlarken yapılan hatalar genellikle küçük ve fark edilmesi zor hatalardır — ta ki sonuç ortaya çıkana kadar. Bir öğretmenin aynı gün iki farklı bölgeye yazılması, izinli olduğu bilinen bir öğretmenin yine de çizelgede görünmesi, ya da bir bölgenin o gün için hiç kimseye atanmamış olması gibi hatalar, gözle kontrolde kolayca atlanabilir.</p>
<h3>En Sık Görülen Excel Hataları</h3>
<ul>
  <li>Aynı öğretmenin aynı gün birden fazla bölgeye yazılması</li>
  <li>Rapor/izin bilgisinin çizelgeye zamanında yansıtılmaması</li>
  <li>Kopyala-yapıştır sırasında yanlış satırın üzerine yazılması</li>
  <li>Bir bölgenin belirli bir gün için boş bırakılması ve fark edilmemesi</li>
  <li>Branş uyuşmazlığı olan bir öğretmenin uygun olmayan bir bölgeye (örneğin laboratuvar) atanması</li>
</ul>
<p>Bu hataların ortak özelliği şu: çoğu, çizelge öğretmenler odasına asıldıktan SONRA fark ediliyor. Bu da hem idareci için itibar kaybı hem de son anda yapılan acele düzeltmeler anlamına geliyor.</p>
<p>Hatanın kendisi kadar, hatanın fark edilme şekli de sorun yaratıyor. Bir öğretmen kendi ismini çizelgede yanlış yerde gördüğünde, bunu önce meslektaşlarıyla paylaşıyor, idareye gelene kadar konu zaten öğretmenler odasında konuşulmuş oluyor. Bu da idarenin hatayı sessizce düzeltme şansını ortadan kaldırıyor ve durumu gereğinden büyük bir mesele hâline getiriyor.</p>

<h2 id="dezavantaj-5">5. Dezavantaj — Geçmiş Nöbetleri Analiz Etmek Zordur</h2>
<p>Bir öğretmen "ben geçen dönem de kantin nöbetindeydim, bu dönem de bana veriliyor" dediğinde, bu iddiayı doğrulamak ya da çürütmek için geçmiş dönemlerin çizelgelerine bakmak gerekir. Excel'de bu, genellikle ayrı dosyalarda (nobet_eylul.xlsx, nobet_ekim.xlsx gibi) saklanan geçmiş kayıtları tek tek açıp aramak anlamına gelir.</p>
<p>Dönem sayısı arttıkça bu analiz pratik olarak imkansız hâle gelir. Kimse dört ayrı Excel dosyasını açıp bir öğretmenin bölge bazında nöbet geçmişini elle çıkarmak istemez — ve genellikle de yapılmaz. Sonuç olarak, itiraz ya "haklısın, düzeltelim" ya da "hayır, öyle değil" şeklinde, somut veriye dayanmadan kapatılır. Her iki durumda da idarenin güvenilirliği zedelenir.</p>
<p>Bu durum yalnızca öğretmen itirazlarını değil, idarenin kendi planlamasını da zorlaştırıyor. Örneğin bir sonraki dönem için "bu bölgede kim daha az nöbet tuttu, önceliği ona verelim" gibi makul bir karar almak istediğinizde, elinizde güvenilir bir geçmiş kaydı yoksa bu karar da tahminden öteye geçemiyor.</p>

<h2 id="dezavantaj-6">6. Dezavantaj — Resmî Word Çıktısı Hazırlamak Zaman Alır</h2>
<p>Nöbet çizelgesi, genellikle imza bölümlü, resmî evrak formatında panoya asılması ya da dosyalanması gerekir. Excel'den doğrudan bu formata geçmek nadiren sorunsuz olur: sütun genişlikleri yazdırma sayfasına sığmaz, renkler siyah-beyaz yazıcıda gri tonlara döner, sayfa kesmeleri (page break) yanlış yerlerden olur.</p>
<p>Bu yüzden çoğu okul idarecisi, Excel'de hazırladığı çizelgeyi ayrıca Word'e aktarıp yeniden biçimlendiriyor — özellikle imza bölümü, okul logosu ve resmî başlık eklemek için. Bu, aynı bilginin iki farklı programda iki kez düzenlenmesi anlamına gelir; ve Excel'deki çizelge güncellendiğinde, Word'deki kopyanın da elle güncellenmesi unutulabilir.</p>
<p>Bir müdür yardımcısının anlattığı gibi: "Excel'deki tabloyu düzelttim ama panoda asılı olan Word çıktısını değiştirmeyi unuttum; iki hafta boyunca öğretmenler odasında yanlış bir çizelge asılı kaldı, kimse fark etmedi." Bu tür kopukluklar, iki ayrı belge üzerinden çalışmanın neredeyse kaçınılmaz bir sonucu.</p>

<h2 id="dezavantaj-7">7. Dezavantaj — Öğretmen Sayısı Arttıkça Yönetilemez Hâle Gelir</h2>
<p>Excel ile nöbet çizelgesi hazırlamanın en büyük dezavantajı belki de şudur: küçük ölçekte "yeterince iyi" çalışırken, öğretmen sayısı arttıkça sorunlar doğrusal değil, katlanarak artar. 15 öğretmenli bir okulda 3-4 hücreyi kontrol etmek birkaç dakika sürerken, 80 öğretmenli bir lisede aynı kontrol süreci saatler alabilir.</p>
<h3>Kaç Öğretmenden Sonra Sorun Büyüyor?</h3>
<p>Kesin bir eşik yoktur, ama pratikte 30-40 öğretmen civarı çoğu idarecinin "artık bu tabloyu tek başıma güvenle kontrol edemiyorum" dediği noktadır. Bölge sayısı da arttıkça (8-10 bölgeye çıktığında) çapraz kontrol gereken hücre sayısı hızla büyür.</p>
<h4>Örnek: 80 Öğretmenli Bir Lise</h4>
<p>80 öğretmenli, 9 bölgeli bir Anadolu lisesinde görev yapan bir müdür yardımcısı, dönem başı çizelge hazırlığının kendisine tek başına 4 tam iş günü aldığını, buna ek olarak ilk iki hafta boyunca günde ortalama 20-30 dakika "küçük düzeltme" ile uğraştığını belirtiyor. Bu, bir dönemde yalnızca hazırlık ve ilk düzeltmeler için harcanan sürenin 10 iş gününe yaklaştığı anlamına geliyor — üstelik bu süre, öğretmen sayısı sabit kalsa bile her dönem tekrar ediyor.</p>

<table>
  <thead><tr><th></th><th>Manuel (Excel)</th><th>Otomatik</th></tr></thead>
  <tbody>
    <tr><td>15-20 öğretmen</td><td>Yönetilebilir, birkaç saat</td><td>Dakikalar</td></tr>
    <tr><td>40-60 öğretmen</td><td>Günler, sık hata riski</td><td>Dakikalar, değişmez</td></tr>
    <tr><td>80+ öğretmen</td><td>Bir haftaya yakın, yüksek hata riski</td><td>Dakikalar, değişmez</td></tr>
  </tbody>
</table>

<h2 id="gercek-ornekler">Gerçek Okul Örnekleri</h2>
<p>Yukarıdaki yedi dezavantaj soyut kalmasın diye, okul idarecilerinin en sık karşılaştığı beş somut senaryoyu ayrı ayrı ele alalım. Bu senaryoların hepsi, farklı okullardan idarecilerin benzer şekilde anlattığı, tekrar eden durumlar — yani tek bir okula özgü "kötü şans" değil, Excel tabanlı planlamanın yapısal bir sonucu.</p>

<h3>Son Dakika Rapor Alan Öğretmen</h3>
<p>Nöbet gününün sabahı bir öğretmen sağlık raporu getirir. Excel'de bu, o günkü çizelgeyi açıp uygun bir başka öğretmen bulmak, onun o gün zaten nöbetçi olup olmadığını kontrol etmek ve değişikliği not almak anlamına gelir — genellikle birkaç dakika içinde, dersler başlamadan önce yapılması gereken bir iştir. Baskı altında yapılan bu hızlı değişiklik, en sık hata yapılan anlardan biridir.</p>

<h3>Yeni Gelen Öğretmen</h3>
<p>Dönem ortasında göreve başlayan bir öğretmeni sisteme dahil etmek, yalnızca ismini listeye eklemek değildir — hangi bölgelere uygun olduğu, hangi günler müsait olduğu ve mevcut dağılımı bozmadan nereye yerleştirileceği düşünülmelidir. Excel'de bu genellikle "en az nöbeti olan bölgeye ekleyelim" gibi kabaca bir tahminle çözülür, çünkü gerçek dağılımı hesaplamak zaman alır. Sonuç olarak yeni gelen öğretmen, bir süre diğerlerinden belirgin şekilde daha fazla ya da daha az nöbet tutabiliyor — ta ki birkaç ay sonra biri bu farkı fark edip idareye sorana kadar.</p>

<h3>Aynı Kişiye Üst Üste Nöbet Yazılması</h3>
<p>Bir öğretmenin art arda gelen günlerde ya da haftalarda sürekli nöbetçi çıkması, genellikle kasıtlı değil, çizelgeyi güncellerken diğer hücrelerin gözden kaçırılmasından kaynaklanır. Öğretmen bunu fark ettiğinde haklı olarak rahatsız olur, ve idarecinin "dikkat etmemişim" demekten başka söyleyeceği bir şey kalmaz.</p>

<h3>Sürekli Pazartesi Nöbeti Verilmesi</h3>
<p>Dönme (rotasyon) mantığı doğru kurulmadığında, bazı öğretmenler sürekli aynı güne denk gelir. Bunun en yaygın nedeni, çizelge her güncellendiğinde dönme sırasının elle takip edilmesi gerekmesidir — bir noktada sıra şaşırılır ve fark edilmeden aynı kişi hep aynı güne yazılmaya devam eder.</p>

<h3>Öğretmen İtirazları</h3>
<p>Tüm bu senaryoların ortak sonucu, öğretmenler odasında biriken güvensizliktir. Bir öğretmen "neden hep ben" dediğinde, idarecinin elinde somut, güncel bir veri yoksa, tartışma duygusal bir zemine kayar. Oysa aynı soru, güncel bir nöbet geçmişi tablosuyla birkaç saniyede, veriyle cevaplanabilir. Deneyimli idareciler, bu tür itirazların büyük kısmının aslında adaletsizlikten değil, veriye erişememekten kaynaklandığını söylüyor — öğretmen haklı ya da haksız olsun, cevabın hızlı ve somut gelmesi tartışmanın büyümesini engelliyor.</p>

<div class="mkt-card" style="margin: 20px 0; border-left: 3px solid var(--text-muted); padding-left: 16px;"><strong>Not:</strong> Bu beş senaryonun hiçbiri "kötü yönetim" göstergesi değil — bunlar, elle takip edilen bir sistemin doğal sınırları. Aynı idareci, aynı verilerle otomatik bir sistemde çalıştığında genellikle bu sorunların çoğunu hiç yaşamıyor.</div>

<h2 id="excel-yerine">Excel Yerine Nasıl Daha Verimli Çalışılabilir?</h2>
<p>Buraya kadar anlatılan yedi dezavantajın ortak paydası şu: Excel bir hesap tablosu programıdır, nöbet planlama ise kural tabanlı bir dağıtım problemidir. İkisi arasındaki fark açıldıkça, elle yapılan iş de o oranda artıyor.</p>
<p>OkulNöbet, bu boşluğu doldurmak için nöbet planlamasına özel olarak tasarlandı. İşleyiş şöyle: öğretmenleri tek tek elle girmek yerine MEB teşkilat şemasından otomatik olarak aktarıyorsunuz. Ardından okulunuzun nöbet bölgelerini (bahçe, koridor, kantin, yemekhane gibi) bir kere tanımlıyorsunuz. Branş kısıtı, çift nöbet yasağı, izinli/raporlu öğretmen gibi kuralları belirledikten sonra, sistem geçmiş nöbetleri dikkate alarak adil bir rotasyonla çizelgeyi otomatik oluşturuyor.</p>
<p>Değişiklik gerektiğinde — bir öğretmen rapor aldığında ya da yeni biri göreve başladığında — çizelgenin tamamını değil, yalnızca ilgili kısmı güncelliyorsunuz; sistem geri kalan kuralları otomatik olarak yeniden uyguluyor. Çizelge hazır olduğunda Word çıktısı alıp doğrudan öğretmenler odasına asabiliyorsunuz; belirli hücreleri elle kilitlemek isterseniz (örneğin bir öğretmenin belirli bir günde sabit nöbetçi olmasını istiyorsanız) bunu da yapabiliyor, sistem geri kalan dağılımı o kilide göre ayarlıyor.</p>
<p>Bu, Excel'i "kötü" bir araç yapmaz — yalnızca farklı bir problem için tasarlanmış bir araçtır. Nöbet planlaması gibi kural tabanlı, tekrar eden ve sürekli güncellenmesi gereken bir süreç için, o sürece özel tasarlanmış bir sistem kullanmak, aynı işi çok daha az elle müdahaleyle tamamlamayı sağlıyor.</p>
<p>Değişikliğin en çok fark edildiği an genellikle dönem ortasında yaşanan bir güncelleme anı oluyor: eskiden bir rapor bildirimi 20-30 dakikalık bir çizelge kontrolü gerektirirken, kurallar bir kez tanımlandıktan sonra aynı güncelleme birkaç tıkla tamamlanabiliyor. Zaman kazancı tek seferlik değil, dönem boyunca her küçük değişiklikte tekrarlanan bir kazanç.</p>

<table>
  <thead><tr><th></th><th>Eski Yöntem (Excel/Word)</th><th>Dijital Yöntem (OkulNöbet)</th></tr></thead>
  <tbody>
    <tr><td>Öğretmen listesi girişi</td><td>Tek tek elle</td><td>MEB teşkilat şemasından otomatik aktarım</td></tr>
    <tr><td>Kural kontrolü</td><td>Gözle, elle</td><td>Tanımlanan kurallara göre otomatik</td></tr>
    <tr><td>Değişiklik sonrası güncelleme</td><td>İlgili tüm hücreler elden geçirilir</td><td>Yalnızca ilgili kayıt güncellenir</td></tr>
    <tr><td>Resmî çıktı</td><td>Ayrıca Word'de yeniden biçimlendirilir</td><td>Doğrudan Word çıktısı, imza bölümlü</td></tr>
  </tbody>
</table>

<p>Nöbet çizelgesi hazırlığına başlamadan önce hangi verilerin (öğretmen listesi, bölgeler, kurallar) hazır olması gerektiğini daha ayrıntılı ele aldığımız <a href="/blog/nobet-cizelgesi-hazirlamadan-once-bilinmesi-gerekenler">Nöbet Çizelgesi Hazırlamadan Önce Bilinmesi Gerekenler</a> yazımıza da göz atabilirsiniz — bu yazıdaki yedi dezavantajın büyük kısmı, aslında hazırlık aşamasında atlanan adımlardan kaynaklanıyor.</p>

<div class="mkt-card" style="text-align: center; margin: 40px 0 8px; padding: 36px 28px;">
  <h2 style="margin: 0 0 12px;">Excel yerine dakikalar içinde nöbet programınızı hazırlayın.</h2>
  <p style="color: var(--text-muted); margin: 0 0 24px; font-size: 15px; line-height: 1.7;">
    Öğretmenleri MEB teşkilat şemasından otomatik aktarın. Nöbet bölgelerinizi oluşturun. Kurallarınızı belirleyin.
    Adil nöbet çizelgenizi birkaç dakika içinde oluşturun. Word olarak yazdırın ve panoya asın.
  </p>
  <a href="/signup" class="mkt-btn mkt-btn-primary mkt-btn-lg">Ücretsiz Başla</a>
</div>$article$,
  'published',
  'Nöbet Yönetimi',
  array['excel nöbet çizelgesi', 'öğretmen nöbet çizelgesi', 'nöbet programı', 'okul nöbet programı', 'adil nöbet dağılımı', 'word nöbet çizelgesi', 'manuel nöbet çizelgesi', 'nöbet planlama'],
  null,
  $meta$Excel ile nöbet çizelgesi hazırlamanın 7 dezavantajı: manuel işlem yükü, adil dağılım takibi, hata riski ve daha fazlası — gerçek okul örnekleriyle.$meta$,
  $faqjson$[{"q":"Excel ile nöbet çizelgesi hazırlamak tamamen yanlış mı?","a":"Hayır, küçük öğretmen sayısına sahip okullarda (15-20 civarı) dikkatli kullanıldığında Excel işe yarayabilir. Sorun, öğretmen ve bölge sayısı arttıkça hücreler arasında otomatik bir kural kontrolü olmamasından kaynaklanıyor; bu noktada elle yapılan kontrol süresi ve hata riski hızla artıyor."},{"q":"Excel'de nöbet çizelgesi hazırlarken en çok zaman hangi işe gidiyor?","a":"Genellikle tek seferlik hazırlıktan çok, dönem içinde yapılan küçük güncellemeler (rapor, izin, yeni öğretmen) en çok zamanı alıyor. Her değişiklik, ilgili haftanın ve bazen de \"kim kaç kez nöbet tuttu\" özet tablosunun elle yeniden gözden geçirilmesini gerektiriyor."},{"q":"Adil nöbet dağılımı Excel'de nasıl takip edilir?","a":"Genellikle ayrı bir sekmede her öğretmenin toplam nöbet sayısını ve hangi bölgelerde kaçar kez nöbet tuttuğunu gösteren bir tablo tutularak yapılır. Ancak bu tablo ana çizelgeyle otomatik bağlantılı olmadığından, elle güncellenmesi unutulduğunda gerçek dağılımdan kopabiliyor."},{"q":"Excel'de nöbet çizelgesinde en sık yapılan hata nedir?","a":"Bir öğretmenin aynı gün birden fazla bölgeye yazılması ve izinli/raporlu bir öğretmenin bu bilginin zamanında işlenmemesi nedeniyle çizelgede görünmeye devam etmesi en sık rastlanan iki hatadır. İkisi de genellikle çizelge asıldıktan sonra fark ediliyor."},{"q":"Word ile nöbet çizelgesi hazırlamak Excel'den daha mı iyi?","a":"Word, resmî evrak formatına (imza bölümü, başlık gibi) Excel'den daha kolay uyar, ama herhangi bir hesaplama veya kural kontrolü sunmaz. Çoğu okul, planlamayı Excel'de ya da kafada yapıp sonucu yalnızca yazdırmak için Word'e aktarıyor — bu da aynı bilgiyi iki kez düzenlemek anlamına geliyor."},{"q":"Kaç öğretmenden sonra Excel yetersiz kalmaya başlar?","a":"Kesin bir sayı yok, ama pratikte 30-40 öğretmen ve 6-8 nöbet bölgesi civarı, çoğu idarecinin \"bu tabloyu tek başıma güvenle kontrol edemiyorum\" dediği noktadır. Öğretmen sayısı arttıkça çapraz kontrol gereken hücre sayısı doğrusal değil, katlanarak artıyor."},{"q":"Nöbet çizelgesinde geçmiş verileri analiz etmek neden önemli?","a":"Bir öğretmen \"geçen dönem de aynı bölgede nöbetteydim\" dediğinde, bu iddiayı somut veriyle doğrulamak ya da çürütmek gerekir. Geçmiş dönemler ayrı Excel dosyalarında tutulduğunda bu analiz pratik olarak zorlaşıyor ve itirazlar genellikle veri olmadan, duygusal şekilde kapanıyor."},{"q":"Öğretmen itirazlarını azaltmanın en pratik yolu nedir?","a":"Güncel ve doğru bir nöbet geçmişi kaydı tutmak. Bir öğretmen adaletsizlik iddia ettiğinde, idareci somut sayılarla (kaç kez, hangi bölgede) cevap verebiliyorsa itirazların büyük kısmı daha başlamadan sona eriyor."},{"q":"Excel'deki koşullu biçimlendirme (renklendirme) neden bozulur?","a":"Koşullu biçimlendirme kuralları belirli hücrelere referans verir; bir satır silindiğinde veya eklendiğinde bu referanslar kayabilir. Sonuç olarak renklendirme mantığı bozulur ve tablo, göründüğü gibi güncel bilgiyi yansıtmayabilir."},{"q":"Birden fazla kişi aynı nöbet çizelgesi üzerinde çalışabilir mi?","a":"Excel'de teknik olarak mümkün, ama pratikte versiyon karmaşasına yol açıyor. Müdür yardımcısı ve zümre başkanı gibi birden fazla kişi aynı dosyada çalıştığında, hangisinin güncel olduğunu takip etmek zorlaşıyor."},{"q":"Nöbet çizelgesini otomatik hazırlayan bir sisteme geçmek zor mu?","a":"Temel adım, öğretmen listesini ve nöbet bölgelerini bir kez tanımlamaktır. OkulNöbet'te öğretmenler MEB teşkilat şemasından otomatik aktarılabildiği için bu adım elle veri girişinden çok daha hızlı tamamlanıyor; kurallar belirlendikten sonra çizelge otomatik oluşuyor."},{"q":"Dijital bir sisteme geçince eski Excel verileri kullanılabilir mi?","a":"Geçmiş dönemlerin nöbet sayıları referans amacıyla değerlendirilebilir, ancak yeni sistemde adil dağılım hesaplaması yeni dönemden itibaren, sistemin kendi kayıtlarına göre ilerler. Önemli olan, geçiş sonrası tüm nöbet verilerinin tek ve güncel bir kaynakta tutulmasıdır."},{"q":"Otomatik nöbet çizelgesi programı ek maliyet gerektirir mi?","a":"OkulNöbet'te ücretsiz bir plan bulunur: okul kaydolup tüm dönem için program üretebilir, ücretsiz planda üretilen programın yalnızca ilk ayı görüntülenebilir. Güncel plan ve fiyat bilgisi Fiyatlandırma sayfasında yer alır."},{"q":"Nöbet çizelgesi hazırlarken hem Excel hem otomatik sistemi bir arada kullanmak mümkün mü?","a":"Geçiş döneminde bazı okullar bir süre paralel ilerleyebilir, ama bu iki ayrı kaynağın senkron kalmasını gerektirdiğinden ek yük oluşturur. Genellikle bir dönem başında tamamen geçiş yapmak, karışıklığı en aza indiren yaklaşımdır."}]$faqjson$::jsonb,
  now()
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  status = excluded.status,
  category = excluded.category,
  tags = excluded.tags,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  faq = excluded.faq,
  updated_at = now();
