-- Yeni blog yazısı: "Öğretmen Nöbet Yönetmeliği (2026 Güncel Rehber)"
-- (/blog/ogretmen-nobet-yonetmeligi). content/faq dolar-tırnaklama ($article$...$article$)
-- ile ekleniyor — bkz. migration 0048/0049/0050'deki aynı desen/gerekçe.
-- Bu yazı diğerlerinden farklı olarak resmî MEB yönetmelik metinlerine
-- (Ortaöğretim Kurumları Yönetmeliği Madde 78/80/91, Okul Öncesi Eğitim
-- ve İlköğretim Kurumları Yönetmeliği Madde 44) dayanır; her iddia ilgili
-- madde/fıkra numarasıyla atıflandırılmış ve doğrulanamayan bir iddia
-- ("ücretli öğretmen muafiyeti") açıkça yönetmelikte bulunamadığı
-- belirtilerek ele alınmıştır. Kaynaklar yazının "Kullanılan Resmî
-- Kaynaklar" bölümünde listelenir.
insert into public.blog_posts (
  slug, title, excerpt, content, status, category, tags,
  meta_title, meta_description, faq, published_at
) values (
  'ogretmen-nobet-yonetmeligi',
  'Öğretmen Nöbet Yönetmeliği (2026 Güncel Rehber)',
  $excerpt$Öğretmen nöbet görevi, muafiyet şartları ve okul yöneticilerinin sorumlulukları — resmî yönetmelik maddelerine dayanan kapsamlı rehber.$excerpt$,
  $article$<div class="alert alert-warning" style="margin: 0 0 24px;"><strong>Önemli not:</strong> Bu yazı hukuki görüş veya danışmanlık niteliği taşımaz. İçerik, yazının hazırlandığı tarih itibarıyla erişilebilen resmî Millî Eğitim Bakanlığı yönetmelik metinlerine dayanmaktadır. Yönetmelikler zaman içinde değişebilir; bir uygulamayı hayata geçirmeden önce güncel metni <a href="https://www.mevzuat.gov.tr" target="_blank" rel="noopener noreferrer">mevzuat.gov.tr</a> üzerinden veya okulunuzun bağlı olduğu il/ilçe millî eğitim müdürlüğünden teyit etmenizi öneririz.</div>

<p>Her eğitim-öğretim yılı başında, hemen her okulda aynı sorular yeniden gündeme gelir: bu öğretmene nöbet yazılabilir mi, o öğretmen gerçekten muaf mı, süresi ne kadar. Nöbet görevi, okul idaresi ile öğretmenler arasında en sık yanlış anlaşılan konulardan biri. "Şu öğretmene kesinlikle nöbet yazılamaz" ya da "hamile bir öğretmen hiçbir şekilde nöbet tutamaz" gibi ifadeler öğretmenler odasında sıkça duyulur — ama bu ifadelerin bir kısmı yönetmeliğin söylediğinden daha kesin, bir kısmı ise daha gevşek. Bu yazı, öğretmen nöbet görevini düzenleyen iki temel yönetmeliği (ortaöğretim kurumları için ayrı, okul öncesi ve ilköğretim kurumları için ayrı) madde madde, güncel metinlerine dayanarak ele alıyor.</p>

<p>Amacımız, okul müdürü ve müdür yardımcılarının nöbet çizelgesi hazırlarken karşılaştıkları "bu doğru mu, yanlış mı" sorularına, yönetmeliğin gerçekte ne dediğini göstererek cevap vermek. Yönetmelikte açık bir hüküm bulamadığımız noktaları da olduğu gibi belirtiyoruz — tahmin yürütmek yerine.</p>
<p>Nöbet görevinin asıl amacı da yönetmelik metninde dolaylı olarak görülüyor: okulun düzeninin, güvenliğinin ve öğrenci gözetiminin ders saatleri dışındaki (teneffüs, giriş-çıkış, öğle arası gibi) zaman dilimlerinde de sürekli sağlanması. Bu amaç, nöbetin neden "isteğe bağlı bir ek görev" değil, yönetmelikle tanımlanmış resmî bir görev olduğunu açıklıyor — ve aynı zamanda neden muafiyetlerin de sınırlı, gerekçeli kategorilere bağlandığını gösteriyor.</p>

<div class="mkt-card" style="margin: 24px 0;">
  <p style="margin: 0 0 10px; font-weight: 700; color: var(--text);">İçindekiler</p>
  <ol style="margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: 14px;">
    <li><a href="#mevzuat">Öğretmen Nöbet Görevi Hangi Mevzuata Göre Düzenlenmektedir?</a></li>
    <li><a href="#kapsam">Nöbet Görevinin Kapsamı</a></li>
    <li><a href="#kimlere-verilir">Nöbet Görevi Kimlere Verilir?</a></li>
    <li><a href="#kimlere-verilmez">Nöbet Görevi Kimlere Verilmez?</a></li>
    <li><a href="#muafiyet">Nöbetten Muafiyet Durumları</a></li>
    <li><a href="#mudur-sorumluluklari">Okul Müdürlerinin Sorumlulukları</a></li>
    <li><a href="#mudur-yardimcisi-sorumluluklari">Müdür Yardımcılarının Sorumlulukları</a></li>
    <li><a href="#cizelge-hazirlama">Nöbet Çizelgesi Hazırlanırken Dikkat Edilmesi Gerekenler</a></li>
    <li><a href="#yanlis-uygulamalar">Okullarda En Sık Yapılan Yanlış Uygulamalar</a></li>
    <li><a href="#yanlis-bilgiler">Sık Karşılaşılan Yanlış Bilgiler</a></li>
    <li><a href="#okulnobet-cozumu">OkulNöbet Bu Süreci Nasıl Kolaylaştırıyor?</a></li>
    <li><a href="#sss">Sık Sorulan Sorular</a></li>
    <li><a href="#kaynaklar">Kullanılan Resmî Kaynaklar</a></li>
  </ol>
</div>

<h2 id="mevzuat">Öğretmen Nöbet Görevi Hangi Mevzuata Göre Düzenlenmektedir?</h2>
<p>Türkiye'de öğretmenlerin nöbet görevi, okul türüne göre <strong>iki ayrı yönetmelikte</strong> düzenlenir. İkisi de aynı Bakanlığa (Millî Eğitim Bakanlığı) bağlı olsa da, madde numaraları ve bazı ayrıntılar farklıdır.</p>

<h3>Ortaöğretim Kurumları İçin: Madde 91</h3>
<p>Liseler (Anadolu lisesi, meslekî ve teknik ortaöğretim, imam-hatip lisesi vb.), <strong>Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği</strong>'ne tabidir (7/9/2013 tarihli ve 28758 sayılı Resmî Gazete'de yayımlanmıştır). Nöbet görevinin esasları bu yönetmeliğin <strong>91. maddesinde</strong>, "Öğretmenlere nöbet görevi verilmesinin esasları" başlığı altında düzenlenir.</p>

<h3>Okul Öncesi ve İlköğretim Kurumları İçin: Madde 44</h3>
<p>Anaokulu, ilkokul ve ortaokullar ise <strong>Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği</strong>'ne tabidir. Bu yönetmelikte nöbet görevi <strong>44. maddede</strong>, "Müdür yardımcısı ve öğretmenlerin nöbet görevi" başlığı altında ele alınır.</p>

<div class="alert alert-info" style="margin: 20px 0;"><strong>Resmî Kaynak:</strong> Ortaöğretim Kurumları Yönetmeliği Madde 91/1: "Öğretmenler, nöbet görevini nöbet çizelgesine göre yerine getirirler." — İlköğretim Kurumları Yönetmeliği Madde 44/1'de aynı ilke müdür yardımcıları için de tanımlanır: "Müdür yardımcıları, okulda kendilerine verilen nöbet görevini yerine getirir, nöbetçi öğretmen ve öğrencileri izler, nöbet raporlarını inceler, varsa sorunları müdüre bildirir."</div>

<p>Bu yazının geri kalanında, atıf yaptığımız her madde ve fıkrayı numarasıyla birlikte belirteceğiz ki isterseniz kendiniz de doğrudan resmî metinden kontrol edebilesiniz. Ayrıca her iki yönetmeliğe de atıfta bulunacağız; aralarında önemli bir fark olduğunda bunu açıkça belirteceğiz, aksi hâlde ikisinin de aynı yönde düzenleme içerdiğini varsayabilirsiniz. İki yönetmeliğin ayrı ayrı var olmasının pratik bir sonucu şu: bir ilkokul müdür yardımcısının bir lisede geçerli olan bir uygulamayı olduğu gibi kendi okuluna taşıması güvenli değildir — madde numaraları farklı olduğu gibi, bazı fıkraların eklenme/değişme tarihleri de farklıdır. Bu yazıda her iki yönetmeliğin kendi madde numarasını ayrı ayrı belirtmemizin nedeni tam olarak bu.</p>

<table>
  <thead><tr><th>Okul Türü</th><th>Mevzuat</th><th>İlgili Madde</th></tr></thead>
  <tbody>
    <tr><td>Lise / Ortaöğretim</td><td>Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği</td><td>Madde 91</td></tr>
    <tr><td>İlkokul / Ortaokul</td><td>Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği</td><td>Madde 44</td></tr>
    <tr><td>Anaokulu / Bağımsız Anasınıfı</td><td>Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği</td><td>Madde 44, fıkra 2</td></tr>
  </tbody>
</table>

<h2 id="kapsam">Nöbet Görevinin Kapsamı</h2>
<p>Nöbet görevinin ne zaman başlayıp bittiği, hangi öğretmenin hangi okulda nöbet tutacağı gibi sorular, her iki yönetmelikte de neredeyse birebir aynı şekilde düzenlenmiştir.</p>

<h3>Nöbetin Başlangıç ve Bitiş Saatleri</h3>
<p>Ortaöğretim Kurumları Yönetmeliği Madde 91/2-c ve İlköğretim Kurumları Yönetmeliği Madde 44/8 aynı hükmü içerir: <strong>nöbet görevi ilk dersten 30 dakika önce başlar, son ders bitiminden 30 dakika sonra biter.</strong> Bu süre, okulun özelliğine göre öğretmenler kurulu kararıyla <strong>15 dakikadan az olmamak kaydıyla</strong> kısaltılabilir.</p>
<p>İkili öğretim yapılan okullarda öğretmenler yalnızca kendi devrelerinde (sabahçı/öğlenci) nöbet tutar (Ortaöğretim Y. Madde 91/2-c). İlköğretim Kurumları Yönetmeliği Madde 44/4'te ise tekli eğitim yapan okullarda öğretmenlerin gün süresince, ikili eğitim yapan okullarda kendi devrelerinde nöbet tuttuğu; tekli eğitimde öğle arasındaki nöbetin ise nöbetçi öğretmenlerin dinlenme süreleri gözetilerek dönüşümlü ve dengeli biçimde okul idaresince düzenlenmesi gerektiği ayrıca belirtilir.</p>

<table>
  <thead><tr><th>Durum</th><th>Kural</th><th>Dayanak</th></tr></thead>
  <tbody>
    <tr><td>Nöbetin başlangıcı</td><td>İlk ders başlamadan 30 dakika önce</td><td>Ort. Y. m.91/2-c, İlk. Y. m.44/8</td></tr>
    <tr><td>Nöbetin bitişi</td><td>Son ders bitiminden 30 dakika sonra</td><td>Ort. Y. m.91/2-c, İlk. Y. m.44/8</td></tr>
    <tr><td>Kısaltma imkânı</td><td>Öğretmenler kurulu kararıyla, 15 dakikadan az olmamak kaydıyla</td><td>Ort. Y. m.91/2-c, İlk. Y. m.44/8</td></tr>
    <tr><td>İkili öğretimde nöbet</td><td>Öğretmenler yalnızca kendi devrelerinde nöbet tutar</td><td>Ort. Y. m.91/2-c, İlk. Y. m.44/4</td></tr>
    <tr><td>Tekli öğretimde öğle arası nöbeti</td><td>Nöbetçi öğretmenlerin dinlenme süresi gözetilerek dönüşümlü düzenlenir</td><td>İlk. Y. m.44/4</td></tr>
  </tbody>
</table>

<h3>Birden Fazla Okulda Görevli Öğretmenler</h3>
<p>Bir öğretmen birden fazla okulda ders okutuyorsa, nöbet görevini <strong>kadrosunun/aylığının bulunduğu okulda</strong> tutar; eğer o okulda dersi yoksa, <strong>en çok ders okuttuğu okulda</strong> nöbete yazılır (Ortaöğretim Y. Madde 91/2-b; İlköğretim Y. Madde 44/5). Bu, bir öğretmenin aynı anda birden fazla okulun nöbet listesine yazılmasını önlemeye yönelik bir kuraldır.</p>
<p>Pratikte bu kural, özellikle birden fazla okulda kısmi ders yükü olan branş öğretmenlerinde (örneğin bazı meslek dersleri veya seçmeli ders öğretmenleri) karışıklığa yol açabiliyor. Bir öğretmenin "asıl" okulunun hangisi olduğu konusunda tereddüt varsa, kadronun/aylığın bağlı olduğu okul kaydı esas alınmalı — bu, ders saati sayısından bağımsız, idari bir kayıt meselesidir.</p>

<div class="mkt-card" style="margin: 20px 0; border-left: 3px solid var(--text-muted); padding-left: 16px;"><strong>Not:</strong> 2026 yılı içinde yayımlanan bir değişiklikle (28/7/2026 tarihli ve 33323 sayılı Resmî Gazete), İlköğretim Kurumları Yönetmeliği Madde 44'e yeni bir fıkra eklenmiştir: taşıma merkezi okullarda görevli öğretmenler, Millî Eğitim Bakanlığı Taşıma Yoluyla Eğitime Erişim Yönetmeliği kapsamında verilen nöbet görevlerini de yerine getirir. Taşıma merkezi bir okulda görev yapıyorsanız, bu ek yükümlülüğü de göz önünde bulundurmanız gerekir.</div>

<h2 id="kimlere-verilir">Nöbet Görevi Kimlere Verilir?</h2>
<p>Yönetmelik, nöbet görevinin temel dağıtım ilkesini şöyle tanımlar: <strong>öğretmenlere, dersinin en az bulunduğu gün veya günlerde nöbet görevi verilir</strong> (Ortaöğretim Y. Madde 91/2-a). Bu ilkenin amacı, ders yükü zaten yoğun olan bir öğretmene, o yoğunluğun üzerine bir de o gün nöbet yükü bindirmemektir — nöbet dağılımının rastgele değil, öğretmenin o günkü fiilî ders programına göre yapılması gerektiğini gösterir.</p>
<p>Müdür yardımcıları da nöbet görevi kapsamındadır — İlköğretim Kurumları Yönetmeliği Madde 44/1'de bu açıkça belirtilir: müdür yardımcıları kendilerine verilen nöbet görevini yerine getirir, nöbetçi öğretmen ve öğrencileri izler, nöbet raporlarını inceler.</p>
<p>Müdür yardımcısı veya öğretmen sayısının yeterli olmadığı okullarda, aynı kişiye haftada birden fazla nöbet görevi verilebilir (İlköğretim Y. Madde 44/3). Bu, küçük kadrolu okullarda pratikte sıkça karşılaşılan bir durumdur.</p>
<p>Bu ilkenin arkasındaki mantık, nöbet yükünün ders yüküyle ters orantılı dağıtılmasıdır: dersi az olan öğretmenin, ders dışı zamanının bir kısmını nöbete ayırması, dersi çok olan bir öğretmene göre daha dengeli görülüyor. Ancak yönetmelik bunu matematiksel bir formülle değil, genel bir ilke olarak tanımladığı için, ders yükü birbirine yakın öğretmenler arasında dağılımı somutlaştırmak yine de okul idaresinin takdirine kalıyor.</p>

<h2 id="kimlere-verilmez">Nöbet Görevi Kimlere Verilmez?</h2>
<p>Bu, okul idarecilerinin en çok emin olmak istediği konu. Her iki yönetmelik de belirli, sınırlı sayıda kategori tanımlar — yönetmelikte sayılmayan bir gerekçeyle nöbetten muafiyet tanınması, yönetmeliğin lafzına dayanmaz.</p>

<h3>Hamile Öğretmenler</h3>
<p>Ortaöğretim Y. Madde 91/2-ç ve İlköğretim Y. Madde 44/7 (ikisi de 2023 tarihli değişiklikle güncellenmiştir): <strong>hamile öğretmenlere, hamileliğin yirmi dördüncü haftasından itibaren ve doğum sonrası analık izni süresinin bitimini takip eden iki yıllık sürenin sonuna kadar, istememesi hâlinde nöbet görevi verilmez.</strong></p>
<div class="alert alert-warning" style="margin: 20px 0;"><strong>Dikkat:</strong> Bu madde "istememesi hâlinde" ifadesiyle kurulmuştur — yani muafiyet otomatik/zorunlu değildir, öğretmenin tercihine bağlıdır. Bir hamile öğretmen isterse nöbet tutmaya devam edebilir; idarenin görevi bu tercihe saygı göstermektir, tek taraflı olarak "hamile olduğun için seni nöbetten çıkarıyorum" ya da tam tersi "hamile olduğun için nöbet tutmaya devam edeceksin" dayatması yapmak değildir.</div>
<p>Bu maddenin 2023 yılında (RG 8/9/2023-32303 ile) bir yıldan iki yıla çıkarılması, aslında geniş bir değişikliğin parçası — doğum sonrası analık izni süresinin bitimini takip eden dönem uzatılarak, yeni anne olan öğretmenlerin okula döndükten sonraki ilk döneminde de bu koruma devam ettiriliyor. Okul idarecilerinin bu süre hesaplamasını yaparken analık izninin fiilen ne zaman bittiğini (yani doğum tarihini değil, izin bitiş tarihini) baz alması gerekiyor.</p>

<h3>20/25 Yıl Hizmet Süresini Dolduran Öğretmenler</h3>
<p>Hizmet yılı <strong>kadınlarda 20, erkeklerde 25 yılı dolduran öğretmenler, istemeleri hâlinde</strong> nöbet görevinden muaf tutulabilir (Ortaöğretim Y. Madde 91/2-d; İlköğretim Y. Madde 44/6). Ancak her iki yönetmelik de aynı önemli istisnayı içerir: <strong>bu kapsamdaki öğretmen sayısının fazla olması nedeniyle nöbet görevinin aksaması durumunda, bu öğretmenlere de nöbet görevi verilebilir.</strong> Yani bu muafiyet de mutlak değildir; okulun fiilen nöbet tutabilecek yeterli öğretmen sayısına bağlıdır.</p>
<p>Bu, uygulamada en çok tartışılan ve okul idarelerinin en çok soru aldığı muafiyet kategorilerinden biri, çünkü "öğretmen sayısının yeterli olup olmadığı" sorusu yönetmelikte sayısal bir eşikle tanımlanmamış. Bir okulda kıdemli öğretmen oranı yüksekse, idarenin "ihtiyaç var" gerekçesiyle bu öğretmenlere de nöbet vermesi mümkün; düşükse, muafiyet sorunsuz uygulanabilir. Bu değerlendirmeyi yaparken idarenin gerekçesini somut biçimde (örneğin nöbet tutabilecek toplam öğretmen sayısı ile ihtiyaç duyulan nöbet sayısını karşılaştırarak) ortaya koyması, olası bir itirazda elini güçlendirir.</p>

<h3>Engelli Öğretmenler ve Engelli Yakını Bulunanlar</h3>
<p>Ortaöğretim Y. Madde 91/2-g ve İlköğretim Y. Madde 44/11 (son hâliyle 2025 tarihli değişikliklerle güncellenmiştir): <strong>engelli olan öğretmenlere, özel eğitim ihtiyacı olan çocuğu bulunanlara ve bakmakla yükümlü olduğu engelli birey bulunan öğretmenlere nöbet görevi verilmez.</strong> Ancak bu durumdaki öğretmenlere istemeleri hâlinde, gün tercihlerine öncelik verilerek nöbet görevi verilir.</p>
<p>Bu madde, önceki iki kategoriden (hamilelik ve hizmet yılı) farklı bir yapıya sahip: burada "istemesi hâlinde" ifadesi tersine dönüyor. Varsayılan durum <em>muafiyettir</em>; öğretmen nöbet tutmak isterse, bunun için ayrıca talepte bulunması ve bu talebin gün tercihine öncelik verilerek karşılanması gerekiyor. Bu üç kategori (hamilelik, engellilik, hizmet yılı) arasındaki "varsayılan muaf mı, varsayılan görevli mi" farkını karıştırmamak önemli — üçü de sonuçta öğretmenin tercihine saygı gösterilmesini gerektiriyor, ama başlangıç noktaları farklı.</p>
<p>"Bakmakla yükümlü olduğu engelli birey" ifadesi de dikkat gerektiren bir ayrıntı: bu, yalnızca öğretmenin kendi çocuğuyla sınırlı değil, eş, ebeveyn gibi bakmakla yükümlü olduğu başka aile bireylerini de kapsayabilecek genişlikte bir ifade. Bu kapsamın sınırlarını netleştirmek için, ilgili belgenin (bakmakla yükümlülüğü ve engelliliği gösteren resmî rapor) okul idaresine sunulması, uygulamada başvurulan yöntem.</p>

<h3>Özel Eğitim Sınıflarında Görevli Öğretmenler</h3>
<p>Ortaöğretim Y. Madde 91/2-ğ'ye göre özel eğitim sınıflarında görev yapan özel eğitim öğretmenleri, nöbet görevlerini genel nöbet çizelgesi yerine <strong>Özel Eğitim Hizmetleri Yönetmeliği</strong>'nin ilgili hükümlerine göre yerine getirir. İlköğretim Y. Madde 44/12'de ise bu öğretmenlerin nöbet görevini, <strong>teneffüs ve yemek saatlerinde sınıflarına kayıtlı öğrencilerin gözetimine devam ederek</strong> yerine getirdiği belirtilir — yani genel anlamda "nöbetten muaf" değiller, nöbetlerini kendi öğrencilerinin gözetimi şeklinde yürütüyorlar.</p>

<table>
  <thead><tr><th>Kategori</th><th>Dayanak Madde</th><th>Muafiyet Niteliği</th></tr></thead>
  <tbody>
    <tr><td>Hamile öğretmen (24. haftadan doğum sonrası analık izninin bitimini takip eden 2 yıla kadar)</td><td>Ort. Y. m.91/2-ç, İlk. Y. m.44/7</td><td>İsteğe bağlı (istememesi hâlinde verilmez)</td></tr>
    <tr><td>20 yıl (kadın) / 25 yıl (erkek) hizmet süresi</td><td>Ort. Y. m.91/2-d, İlk. Y. m.44/6</td><td>İsteğe bağlı, öğretmen sayısı yeterliyse</td></tr>
    <tr><td>Engelli öğretmen / engelli çocuğu olan / engelli birey bakımı olan</td><td>Ort. Y. m.91/2-g, İlk. Y. m.44/11</td><td>Verilmez, ama isterse gün tercihiyle verilebilir</td></tr>
    <tr><td>Özel eğitim sınıfı öğretmeni</td><td>Ort. Y. m.91/2-ğ, İlk. Y. m.44/12</td><td>Farklı biçimde yürütülür, tam muafiyet değil</td></tr>
  </tbody>
</table>

<h2 id="muafiyet">Nöbetten Muafiyet Durumları</h2>
<p>Yukarıdaki kategorilerin ortak noktası şu: hiçbiri idarenin keyfi takdirine bırakılmış bir "iyilik" değil, yönetmelikte sayılan somut bir gerekçeye dayanıyor. Bir öğretmen bu kategorilerden birine giriyorsa, ilgili durumu (sağlık raporu, engelli sağlık kurulu raporu, hizmet süresi belgesi vb.) okul idaresine bildirmesi beklenir.</p>
<p>Bu dört kategorinin dışında kalan, ama okullarda sık dile getirilen başka gerekçeler de var: "evi okula uzak", "küçük çocuğu var (hamilelik/doğum kapsamı dışında)", "yeni atandı" gibi durumlar. Bu gerekçelerin hiçbiri incelediğimiz iki yönetmelik metninde bağımsız bir muafiyet kategorisi olarak yer almıyor. Okul idaresi elbette insani gerekçelerle esneklik gösterebilir, ama bunu yaparken bu tür kararların yönetmelikte tanımlı bir "hak" değil, okul idaresinin kendi takdirine dayanan bir uygulama olduğunu bilmesi, tutarlılık açısından önemli — aksi hâlde benzer durumdaki başka bir öğretmene aynı esnekliği göstermediğinde eşitsizlik iddiasıyla karşılaşabilir.</p>
<div class="alert alert-info" style="margin: 20px 0;"><strong>Not:</strong> Yönetmelik metinlerinde, muafiyet talebinin hangi belgeyle ve hangi süre içinde yapılması gerektiğine dair ayrıntılı bir prosedür maddesi bulunmuyor. Bu nedenle okullar arasında başvuru şekli (dilekçe, e-posta, sözlü bildirim gibi) farklılık gösterebilir. Kendi okulunuzdaki uygulamayı netleştirmek için okul idaresine doğrudan sormanızı öneririz — bu noktada yönetmelik kesin bir usul belirlemiyor.</div>

<h2 id="mudur-sorumluluklari">Okul Müdürlerinin Sorumlulukları</h2>
<p>Ortaöğretim Kurumları Yönetmeliği Madde 78/2-j, müdürün görevleri arasında şunu sayar: <strong>"Öğretmenlerin ve öğrencilerin nöbet görev ve yerlerini belirler, onaylar ve uygulamaya koyar."</strong> Nöbetlerde uyulması gereken esaslar öğretmenler kurulunda görüşülüp kararlaştırıldıktan sonra, okul müdürünün onayına sunulur ve ancak bu onaydan sonra öğretmenlere yazılı olarak duyurulur (Madde 91/2-e).</p>
<p>Bu, nöbet çizelgesinin tek taraflı bir idari kararla değil, öğretmenler kurulunda görüşülerek şekillenen ve müdür onayıyla resmiyet kazanan bir süreç olduğu anlamına geliyor.</p>
<p>Müdürün buradaki rolü iki aşamalı: önce esasların (kimin hangi kurala göre nöbete yazılacağı, muafiyetlerin nasıl uygulanacağı gibi genel çerçevenin) öğretmenler kurulunda görüşülmesini sağlamak, sonra bu çerçeveye göre hazırlanan somut çizelgeyi (kim hangi gün, hangi bölgede nöbetçi) onaylamak. İki aşamayı birbirine karıştırıp yalnızca sonuç çizelgesini onaylamak, öğretmenler kurulunun esaslar üzerindeki görüş bildirme rolünü atlamak anlamına gelebilir.</p>

<h2 id="mudur-yardimcisi-sorumluluklari">Müdür Yardımcılarının Sorumlulukları</h2>
<p>Ortaöğretim Kurumları Yönetmeliği Madde 80/2-d'ye göre: <strong>"Müdür yardımcıları, öğretmen ve öğrencilerin nöbet çizelgelerini hazırlayarak müdürün onayına sunar ve nöbet görevlerini kontrol eder."</strong> İlköğretim Kurumları Yönetmeliği Madde 44/1'de de müdür yardımcılarının kendi nöbet görevlerini yerine getirdiği, nöbetçi öğretmen ve öğrencileri izlediği, nöbet raporlarını incelediği ve sorunları müdüre bildirdiği belirtilir.</p>
<p>Pratikte bu, nöbet çizelgesinin fiilen <strong>müdür yardımcısı tarafından hazırlanan, müdür tarafından onaylanan</strong> bir belge olduğu anlamına gelir — çizelgeyi hazırlama sorumluluğu yönetmelikte açıkça müdür yardımcısına yüklenmiştir.</p>
<p>Birden fazla müdür yardımcısı olan okullarda, bu sorumluluğun kimde olduğu genellikle görev dağılımıyla (bazı okullarda "nöbet işlerinden sorumlu müdür yardımcısı" gibi gayriresmî bir unvanla) netleştiriliyor. Yönetmelik bu dağılımı okul içi bir organizasyon meselesi olarak bıraktığından, birden fazla müdür yardımcısı olan okullarda bu sorumluluğun kime ait olduğunu başlangıçta yazılı biçimde netleştirmek, ilerleyen dönemde "bu benim işim değildi" karışıklığını önler.</p>

<table>
  <thead><tr><th>Görev</th><th>Müdür</th><th>Müdür Yardımcısı</th></tr></thead>
  <tbody>
    <tr><td>Nöbet yer/görev belirleme</td><td>Belirler, onaylar, uygulamaya koyar (Ort. Y. m.78/2-j)</td><td>—</td></tr>
    <tr><td>Çizelge hazırlama</td><td>—</td><td>Hazırlar, müdürün onayına sunar (Ort. Y. m.80/2-d)</td></tr>
    <tr><td>Nöbet kontrolü</td><td>Nihai onay</td><td>Nöbet görevlerini kontrol eder</td></tr>
    <tr><td>Nöbet raporlarını inceleme</td><td>—</td><td>İnceler, sorunları müdüre bildirir (İlk. Y. m.44/1)</td></tr>
  </tbody>
</table>

<h2 id="cizelge-hazirlama">Nöbet Çizelgesi Hazırlanırken Dikkat Edilmesi Gerekenler</h2>
<p>Yönetmelik metinlerinden çıkarılabilecek pratik kontrol listesi şu şekilde:</p>
<ul>
  <li><strong>Muafiyet kategorilerini önce netleştirin:</strong> hamile, 20/25 yıl hizmetli, engelli/engelli yakını bulunan ve özel eğitim öğretmenlerini listeden ayırın.</li>
  <li><strong>"İstemesi hâlinde" ifadesini unutmayın:</strong> muafiyet kategorilerinin çoğu isteğe bağlıdır; öğretmenin tercihini sormadan otomatik karar vermeyin.</li>
  <li><strong>Ders yükünü göz önünde bulundurun:</strong> nöbet, dersin en az olduğu güne verilmelidir.</li>
  <li><strong>Birden fazla okulda görevli öğretmenleri doğru okula yazın:</strong> kadrosunun/aylığının bulunduğu okulda, orada dersi yoksa en çok ders okuttuğu okulda.</li>
  <li><strong>Esasları öğretmenler kurulunda görüşün:</strong> çizelge hazır olduktan sonra değil, esaslar belirlenirken kurulun görüşü alınmalı.</li>
  <li><strong>Yazılı duyuru yapın:</strong> müdür onayından sonra çizelge öğretmenlere yazılı olarak duyurulmalıdır — sözlü bilgilendirme yeterli değildir.</li>
  <li><strong>Nöbet bölgelerini net tanımlayın:</strong> yönetmelik, nöbet yerlerinin hangi fiziksel alanlar olacağını tek tek saymıyor; bu, okulun kendi yapısına göre belirlemesi gereken bir konu. "Koridor nöbeti" gibi genel bir ifade yerine, hangi kat/hangi koridor olduğunu net yazmak, uygulamada karışıklığı azaltır.</li>
  <li><strong>Değişikliği tarihiyle birlikte not edin:</strong> bir muafiyet kararı ya da nöbet süresi kısaltma kararı alındığında, bunu hangi öğretmenler kurulu toplantısında, hangi tarihte kararlaştırıldığını kayıt altına almak, ileride "bu karar ne zaman alınmıştı" sorusuna hazır bir cevap sağlar.</li>
</ul>
<p>Bu maddelerin ortak paydası, nöbet çizelgesinin yalnızca "kim nerede" sorusuna cevap veren bir tablo değil, aynı zamanda yönetmeliğin öngördüğü usul adımlarının (kurul görüşmesi, müdür onayı, yazılı duyuru) izlenebilir bir kaydı olması gerektiğidir. Bu kayıt, hem öğretmenler için şeffaflık sağlar hem de bir itiraz durumunda okul idaresinin elini güçlendirir. Yönetmelik, nöbet bölgelerinin (bahçe, koridor, kantin gibi) hangileri olacağını tek tek saymadığından, bu bölgelerin okulun kendi fiziksel yapısına göre net biçimde tanımlanması da yine okul idaresinin sorumluluğunda kalan bir konudur.</p>

<h2 id="yanlis-uygulamalar">Okullarda En Sık Yapılan Yanlış Uygulamalar</h2>
<p>Saha deneyimlerinden derlenen, tekrar eden yanlış uygulamalar:</p>
<ul>
  <li><strong>Muafiyeti belgeye bakmadan kabul etmek veya reddetmek:</strong> hem öğretmenin beyanını sorgusuz kabul etmek hem de belgeli bir talebi gerekçesiz reddetmek, yönetmeliğin öngördüğü dengeyi bozar.</li>
  <li><strong>Nöbet süresini yönetmelikte belirtilenden uzun tutmak:</strong> ilk ders öncesi 30 dakikadan, son ders sonrası 30 dakikadan fazla bir süre dayatmak, öğretmenler kurulu kararı olmadan yönetmeliğin öngördüğü çerçeveyi aşar.</li>
  <li><strong>Çizelgeyi öğretmenler kurulunda görüşmeden hazırlamak:</strong> esasların kurulda görüşülmesi, sadece bir formalite değil, yönetmeliğin aradığı bir adımdır.</li>
  <li><strong>Yazılı duyuru yapmadan sözlü bilgilendirmeyle yetinmek:</strong> bu, itiraz durumunda idarenin elini zayıflatan bir eksikliktir.</li>
  <li><strong>20/25 yıl hizmetli öğretmeni sorgusuz muaf tutmak:</strong> bu muafiyetin "istemesi hâlinde" ve "öğretmen sayısı yeterliyse" şartlarına bağlı olduğunu unutmak.</li>
  <li><strong>Muafiyet kategorilerini birbirine karıştırmak:</strong> örneğin engelli bir öğretmene "istemesen de nöbet yok" derken, aynı mantığı hizmet yılı 20/25'i geçen bir öğretmene de uygulamak — oysa ikincisinde muafiyet öğretmenin talebine, ilkinde ise varsayılan olarak muafiyete dayanıyor.</li>
  <li><strong>Değişikliği geriye dönük uygulamamak:</strong> örneğin 2023 değişikliğiyle hamilelik sonrası muafiyet süresinin iki yıla çıktığını bilmeden, eski "bir yıl" bilgisiyle karar vermek.</li>
</ul>
<p>Bu hataların çoğu kötü niyetten değil, yönetmeliğin farklı zamanlarda güncellenen maddelerini takip etmenin zorluğundan kaynaklanıyor. Bir okul idarecisinin her değişikliği ayrı ayrı takip etmesi beklenemez; bu yüzden yıllık olarak (örneğin her eğitim-öğretim yılı başında) ilgili maddelerin güncel hâlini bir kez kontrol etmek, dönem içinde yanlış bir varsayımla hareket etme riskini azaltır.</p>

<h2 id="yanlis-bilgiler">Sık Karşılaşılan Yanlış Bilgiler</h2>
<p>İnternette ve öğretmenler odasında dolaşan bazı iddialar, yönetmelik metniyle birebir örtüşmüyor. Üçünü ayrıca ele alalım.</p>

<table>
  <thead><tr><th>İddia</th><th>Gerçek Durum</th><th>Dayanak</th></tr></thead>
  <tbody>
    <tr><td>"Ücretli öğretmenlere nöbet görevi verilemez"</td><td>İncelenen yönetmeliklerde böyle genel bir hükme rastlanmadı</td><td>Ort. Y. m.91, İlk. Y. m.44 (aranan hüküm yok)</td></tr>
    <tr><td>"Hamile öğretmen hamile kaldığı andan itibaren muaftır"</td><td>Muafiyet 24. haftadan itibaren başlar, öncesinde otomatik değildir</td><td>Ort. Y. m.91/2-ç, İlk. Y. m.44/7</td></tr>
    <tr><td>"Nöbet muafiyeti idarenin tek taraflı kararıdır"</td><td>Kategorilerin çoğu öğretmenin talebine/tercihine bağlıdır</td><td>Ort. Y. m.91/2-ç,d,g; İlk. Y. m.44/6,7,11</td></tr>
  </tbody>
</table>

<h3>"Ücretli Öğretmenlere Nöbet Görevi Verilemez" İddiası</h3>
<div class="alert alert-warning" style="margin: 20px 0;"><strong>Dikkat:</strong> Bu iddiayı incelediğimiz Ortaöğretim Kurumları Yönetmeliği Madde 91 ve İlköğretim Kurumları Yönetmeliği Madde 44 metinlerinde, ücretli/kadrosuz öğretmenlere yönelik böyle genel bir muafiyet hükmüne rastlamadık. Nöbet muafiyeti yönetmelikte sayılan somut gerekçelere (hamilelik, hizmet yılı, engellilik vb.) bağlanmıştır; istihdam şekli (kadrolu/ücretli) başlı başına bir muafiyet gerekçesi olarak yönetmelikte yer almıyor. Ücretli öğretmenlerin ders saatleriyle sınırlı çalışma düzeni ayrı bir konu olup, bu yazının dayandığı iki yönetmelikte doğrudan bir "ücretli öğretmen nöbet muafiyeti" hükmü bulunmamaktadır. Kendi okulunuzdaki uygulama farklıysa, bunun okul idaresinin kendi kararı ya da başka bir mevzuat hükmüne dayanıp dayanmadığını sorgulamanızı öneririz.</div>
<p>Bu iddianın bu kadar yaygın olmasının bir nedeni muhtemelen şu: ücretli öğretmenler genellikle sınırlı saatte, yalnızca ders saatlerinde okulda bulunuyor. Bu pratik kısıt, "zaten okulda değil, nöbet tutamaz" gözlemini "yönetmelik nöbet vermeyi yasaklıyor" iddiasına dönüştürüyor — oysa ikisi aynı şey değil. Bir ücretli öğretmen o gün okulda, dersinin en az olduğu saatte bulunuyorsa, teorik olarak nöbet yazılmasının önünde yönetmelikten kaynaklanan bir engel görünmüyor; asıl kısıt fiilî bulunma süresi.</p>

<h3>"Hamile Öğretmen Hiçbir Zaman Nöbet Tutamaz" Yanılgısı</h3>
<p>Yukarıda da belirttiğimiz gibi, muafiyet hamileliğin <strong>24. haftasından itibaren</strong> başlar — yani hamileliğin ilk 23 haftasında bu maddeye dayanarak otomatik bir muafiyet yoktur. Ayrıca muafiyet "istememesi hâlinde" uygulanır; hamile bir öğretmen nöbet tutmaya devam etmek isterse bu onun tercihidir.</p>

<h3>"Nöbet Muafiyeti Otomatiktir" Yanılgısı</h3>
<p>İncelediğimiz muafiyet kategorilerinin büyük kısmı ("istemesi hâlinde", "istememesi hâlinde") öğretmenin talebine bağlıdır; idarenin kendiliğinden, öğretmene sormadan bir kararı dayatması yönetmeliğin lafzına uygun değildir. Engelli öğretmen ve engelli yakını bulunan öğretmenler için de aynı mantık geçerlidir: nöbet verilmez, ama öğretmen isterse gün tercihiyle nöbet tutabilir.</p>
<p>Bu üç yanılgının ortak kökeni aynı: yönetmelik metninin tamamını okumak yerine, kulaktan dolma ya da eski bir metne dayanan bilgiyle karar vermek. Bu yazıyı hazırlarken bizim de birden fazla ikincil kaynakta birbiriyle çelişen bilgilere rastlamamız (örneğin hamilelik sonrası muafiyet süresinin bir kaynakta "bir yıl", diğerinde "iki yıl" olarak geçmesi), doğrudan resmî metne inip madde numarası ve değişiklik tarihiyle doğrulama yapmanın neden önemli olduğunu bizzat gösterdi.</p>
<p>Okul idarecilerine somut önerimiz şu: bir muafiyet ya da kural konusunda emin olmadığınızda, ikincil bir kaynaktan (haber sitesi, forum, sosyal medya) değil, doğrudan ilgili yönetmeliğin güncel, konsolide metninden kontrol edin. Bu yazının sonundaki "Kullanılan Resmî Kaynaklar" bölümü, tam olarak bu kontrolü kendi başınıza yapabilmeniz için gereken madde numaralarını ve kaynak bağlantılarını içeriyor.</p>

<h2 id="okulnobet-cozumu">OkulNöbet Bu Süreci Nasıl Kolaylaştırıyor?</h2>
<p>Yukarıda anlatılan muafiyet kategorilerinin ve kuralların hepsini elle takip etmek — özellikle 40-50 öğretmenli bir okulda — kolay değil. OkulNöbet'te işleyiş şöyle: öğretmenleri MEB teşkilat şemasından otomatik olarak aktarıyorsunuz, ardından okulunuzun nöbet bölgelerini tanımlıyorsunuz. Branş kısıtı, çift nöbet yasağı gibi genel kuralların yanında, <strong>muaf öğretmenleri de sisteme işaretleyebiliyorsunuz</strong> — sistem bu öğretmenleri otomatik dağılımın dışında tutuyor ya da (isterlerse) gün tercihlerine öncelik vererek dahil ediyor.</p>
<p>Bu yaklaşımın altında yatan fikir basit: yönetmeliğin ne dediğine siz karar veriyorsunuz (hangi öğretmenin hangi kategoriye girdiği, hangi kuralın öğretmenler kurulunda kararlaştırıldığı gibi), sistem yalnızca bu kararları her dönem tutarlı ve hatasız biçimde uyguluyor. Nihai sorumluluk ve karar mercii her zaman okul idaresinde kalıyor.</p>
<h4>Muaf Öğretmen Tanımlama Örneği</h4>
<p>Örneğin hamileliğin 24. haftasına giren bir öğretmeni sisteme "muaf" olarak işaretlediğinizde, sistem o öğretmeni doğum sonrası analık izninin bitimini takip eden döneme kadar otomatik dağılımın dışında tutuyor; öğretmen isterse bu tercihini değiştirebiliyorsunuz. Bu, her ay elle hatırlayıp çizelgeden çıkarmanız gereken bir kontrolü ortadan kaldırıyor.</p>
<p>Çizelge hazır olduğunda Word çıktısı alıp doğrudan öğretmenler odasına asabiliyor, dilerseniz belirli hücreleri elle kilitleyebiliyorsunuz. Bu süreç, yukarıda anlattığımız yönetmelik kurallarının yerini almaz — yalnızca bu kuralları uygularken yapılan elle takip işini otomatikleştirir.</p>
<p>Bunun somut faydası, yukarıda bahsettiğimiz "değişikliği geriye dönük uygulamamak" hatasında görülüyor: kurallar bir kez doğru tanımlandığında (örneğin hamilelik sonrası muafiyetin iki yıl olduğu), sistem bu kuralı her öğretmen için tutarlı şekilde uyguluyor — idarecinin her seferinde "bu süre bir yıl mıydı, iki yıl mıydı" diye hatırlamasına gerek kalmıyor. Benzer şekilde, öğretmenler kurulunda kararlaştırılan esaslar (nöbet süresi, kısaltma kararı gibi) bir kez sisteme girildiğinde, çizelgenin tamamında tutarlı biçimde uygulanmış oluyor.</p>

<p>Nöbet çizelgesi hazırlığının genel adımlarını <a href="/blog/nobet-cizelgesi-hazirlamadan-once-bilinmesi-gerekenler">Nöbet Çizelgesi Hazırlamadan Önce Bilinmesi Gerekenler</a> yazımızda, adil dağılımın nasıl sağlanacağını <a href="/blog/adil-nobet-dagilimi-nasil-yapilir">Adil Nöbet Dağılımı Nasıl Yapılır?</a> yazımızda, Excel ile çalışmanın getirdiği zorlukları ise <a href="/blog/excel-ile-nobet-cizelgesi-hazirlamanin-7-dezavantaji">Excel ile Nöbet Çizelgesi Hazırlamanın 7 Dezavantajı</a> yazımızda ele almıştık.</p>

<h2 id="kaynaklar">Kullanılan Resmî Kaynaklar</h2>
<p>Bu yazıda yer alan madde ve fıkra atıfları, aşağıdaki resmî yönetmelik metinlerinin yazının hazırlandığı tarihte erişilebilen (konsolide) hâllerine dayanmaktadır:</p>
<ul>
  <li>Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği (Resmî Gazete: 7/9/2013 – 28758), Madde 78, 80 ve 91 — son görülen değişiklikler: RG 22/2/2025 – 32821, RG 8/9/2023 – 32303, RG 5/9/2019 – 30879, RG 28/10/2016 – 29871, RG 1/9/2018 – 30522.</li>
  <li>Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği, Madde 44 — son görülen değişiklikler: RG 17/1/2025 – 32785, RG 14/10/2023 – 32339, RG 10/7/2019 – 30827, RG 16/6/2016 – 29744.</li>
  <li>Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliğinde Değişiklik Yapılmasına Dair Yönetmelik (Resmî Gazete: 28/7/2026 – 33323) — taşıma merkezi okullardaki nöbet görevine ilişkin ek fıkra.</li>
</ul>
<div class="alert alert-info" style="margin: 20px 0;"><strong>Resmî Kaynak:</strong> Güncel ve resmî metne doğrudan erişmek için <a href="https://www.mevzuat.gov.tr" target="_blank" rel="noopener noreferrer">mevzuat.gov.tr</a> Mevzuat Bilgi Sistemi'ni ya da Millî Eğitim Bakanlığı'nın <a href="https://www.meb.gov.tr/mevzuat/liste.php" target="_blank" rel="noopener noreferrer">meb.gov.tr/mevzuat</a> sayfasını kullanabilirsiniz. Yönetmelikler periyodik olarak değişebildiğinden, bu yazıdaki madde numaraları yerine her zaman güncel metni esas almanızı öneririz.</div>

<div class="mkt-card" style="text-align: center; margin: 40px 0 8px; padding: 36px 28px;">
  <h2 style="margin: 0 0 12px;">Yönetmeliğe uygun nöbet çizelgenizi dakikalar içinde hazırlayın.</h2>
  <p style="color: var(--text-muted); margin: 0 0 24px; font-size: 15px; line-height: 1.7;">
    Öğretmenleri MEB teşkilat şemasından otomatik aktarın. Kurallarınızı belirleyin. Muaf öğretmenleri işaretleyin.
    Adil nöbet çizelgenizi birkaç dakika içinde oluşturun. Word olarak yazdırıp panoya asın.
  </p>
  <a href="/signup" class="mkt-btn mkt-btn-primary mkt-btn-lg">Ücretsiz Başla</a>
</div>$article$,
  'published',
  'Nöbet Yönetimi',
  array['öğretmen nöbet yönetmeliği', 'meb nöbet yönetmeliği', 'öğretmen nöbet görevi', 'nöbet görevi', 'okul nöbet esasları', 'nöbet çizelgesi', 'öğretmen nöbet listesi', 'okul nöbet programı'],
  null,
  $meta$Öğretmen nöbet yönetmeliği: nöbet kimlere verilir, kimlere verilmez, muafiyet şartları ve resmî kaynaklarla güncel, kapsamlı rehber.$meta$,
  $faqjson$[{"q":"Öğretmen nöbet görevi hangi yönetmelikte düzenlenir?","a":"Liseler için Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği Madde 91, ilkokul/ortaokul ve anaokulları için Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği Madde 44 nöbet görevinin esaslarını düzenler. İki yönetmelik de aynı Bakanlığa bağlı olsa da madde numaraları ve bazı ayrıntılar farklıdır."},{"q":"Nöbet görevi kaç dakika önce başlar, kaç dakika sonra biter?","a":"Her iki yönetmeliğe göre de nöbet görevi ilk dersten 30 dakika önce başlar, son ders bitiminden 30 dakika sonra biter. Bu süre, okulun özelliğine göre öğretmenler kurulu kararıyla 15 dakikadan az olmamak kaydıyla kısaltılabilir."},{"q":"Hamile öğretmene ne zamandan itibaren nöbet verilmez?","a":"Hamileliğin 24. haftasından itibaren ve doğum sonrası analık izni süresinin bitimini takip eden iki yıllık sürenin sonuna kadar, öğretmenin istememesi hâlinde nöbet görevi verilmez. Bu süre 2023 tarihli bir değişiklikle bir yıldan iki yıla çıkarılmıştır."},{"q":"Hamile öğretmen isterse nöbet tutabilir mi?","a":"Evet. Yönetmelik metni \"istememesi hâlinde nöbet görevi verilmez\" şeklindedir; yani muafiyet öğretmenin tercihine bağlıdır, otomatik ve zorunlu değildir. Hamile bir öğretmen nöbet tutmaya devam etmek isterse buna engel bir hüküm yoktur."},{"q":"Kaç yıl hizmeti olan öğretmen nöbetten muaf olabilir?","a":"İstekleri hâlinde hizmet yılı kadınlarda 20, erkeklerde 25 yılı dolduran öğretmenler nöbet görevinden muaf tutulabilir. Ancak bu kapsamdaki öğretmen sayısının fazla olması nedeniyle nöbet görevinin aksaması durumunda, bu öğretmenlere de nöbet görevi verilebilir."},{"q":"Engelli öğretmenlere nöbet görevi verilir mi?","a":"Hayır, engelli olan öğretmenlere, özel eğitim ihtiyacı olan çocuğu bulunanlara ve bakmakla yükümlü olduğu engelli birey bulunan öğretmenlere nöbet görevi verilmez. Ancak bu durumdaki öğretmenlere istemeleri hâlinde, gün tercihlerine öncelik verilerek nöbet görevi verilebilir."},{"q":"Özel eğitim öğretmenleri nöbetten tamamen muaf mıdır?","a":"Tam olarak değil. Ortaöğretimde özel eğitim sınıflarında görevli öğretmenler nöbetlerini Özel Eğitim Hizmetleri Yönetmeliği hükümlerine göre yürütür; ilköğretimde ise bu öğretmenler nöbet görevini teneffüs ve yemek saatlerinde kendi sınıflarına kayıtlı öğrencilerin gözetimine devam ederek yerine getirir."},{"q":"Ücretli öğretmenlere nöbet görevi verilemez mi?","a":"İncelediğimiz iki yönetmelik metninde ücretli/kadrosuz öğretmenlere yönelik genel bir nöbet muafiyeti hükmüne rastlamadık. Nöbet muafiyeti yönetmelikte sayılan somut gerekçelere (hamilelik, hizmet yılı, engellilik vb.) bağlıdır; istihdam şekli başlı başına bir muafiyet gerekçesi olarak yer almıyor."},{"q":"Birden fazla okulda ders okutan bir öğretmen nöbeti hangi okulda tutar?","a":"Kadrosunun veya aylığının bulunduğu okulda nöbet tutar; eğer o okulda dersi yoksa, en çok ders okuttuğu okulda nöbete yazılır. Bu kural, bir öğretmenin birden fazla okulun nöbet listesine aynı anda yazılmasını önlemeyi amaçlar."},{"q":"İkili öğretim yapılan okullarda nöbet nasıl işler?","a":"İkili öğretim yapılan okullarda öğretmenler yalnızca kendi devrelerinde (sabahçı veya öğlenci) nöbet tutar. Tek devrede eğitim yapılan okullarda ise nöbet gün boyu sürer."},{"q":"Nöbet çizelgesini kim hazırlar, kim onaylar?","a":"Nöbet çizelgesini müdür yardımcıları hazırlayıp okul müdürünün onayına sunar. Müdür, öğretmenlerin ve öğrencilerin nöbet görev ve yerlerini belirler, onaylar ve uygulamaya koyar. Nöbetlerde uyulması gereken esaslar önce öğretmenler kurulunda görüşülür."},{"q":"Nöbet çizelgesi öğretmenlere nasıl duyurulmalı?","a":"Nöbetlerde uyulması gereken esaslar öğretmenler kurulunda görüşülüp kararlaştırıldıktan ve okul müdürünün onayı alındıktan sonra öğretmenlere yazılı olarak duyurulur. Yalnızca sözlü bilgilendirme yönetmeliğin aradığı şekli karşılamaz."},{"q":"Nöbete özürsüz gelmeyen öğretmene ne uygulanır?","a":"Nöbet görevine özürsüz olarak gelmeyen öğretmen hakkında, derse özürsüz olarak gelmeyen öğretmen hakkında uygulanan işlem uygulanır. Bu, nöbetin de ders gibi resmî bir görev sayıldığı anlamına gelir."},{"q":"Müdür yardımcılarının nöbetle ilgili görevleri nelerdir?","a":"Müdür yardımcıları hem kendilerine verilen nöbet görevini yerine getirir hem de öğretmen ve öğrencilerin nöbet çizelgelerini hazırlayıp müdürün onayına sunar, nöbet görevlerini kontrol eder, nöbet raporlarını inceleyip sorunları müdüre bildirir."},{"q":"Taşıma merkezi okullarda görevli öğretmenler için ek bir nöbet yükümlülüğü var mı?","a":"Evet. 2026 yılında yayımlanan bir değişiklikle, taşıma merkezi okullarda görevli öğretmenlerin, Millî Eğitim Bakanlığı Taşıma Yoluyla Eğitime Erişim Yönetmeliği kapsamında verilen nöbet görevlerini de yapması gerektiği İlköğretim Kurumları Yönetmeliği'ne eklenmiştir."},{"q":"Nöbet muafiyeti için hangi belgeler gerekir?","a":"İncelediğimiz yönetmelik metinlerinde muafiyet başvurusu için standart bir belge/prosedür maddesi bulunmuyor. Uygulamada genellikle ilgili durumu gösteren belgeler (sağlık raporu, engelli sağlık kurulu raporu, hizmet süresi belgesi) okul idaresine sunulur; kesin usul için okulunuzun idaresine danışmanız gerekir."},{"q":"Nöbet görevi resmî tatillerde de var mıdır?","a":"Bu yazının odaklandığı iki yönetmelikte öğretmen nöbeti, öğrenci nöbetinden farklı olarak resmî tatil günleriyle ilgili ayrı bir hüküm içermiyor; öğretmen nöbeti ders günleri çerçevesinde düzenlenmiştir. Öğrenci nöbetiyle ilgili farklı bir hüküm söz konusu olabilir, bu yazının kapsamı dışındadır."},{"q":"Okul müdürü nöbet çizelgesine itiraz gelirse ne yapmalı?","a":"Yönetmelik doğrudan bir itiraz prosedürü tanımlamıyor, ama nöbetin esaslarının öğretmenler kurulunda görüşülmüş ve yazılı duyurulmuş olması, itirazları somut bir zemine oturtmayı kolaylaştırır. İtiraz genellikle ilgili maddeye (örneğin ders yükü dağılımı ya da muafiyet kategorisi) atıfla değerlendirilir."},{"q":"Nöbet görevi bir disiplin süreci midir?","a":"Nöbet görevinin kendisi disiplin süreci değildir, ama nöbete özürsüz gelmemek, derse özürsüz gelmemekle aynı işleme tabi tutulur — bu da disiplin sürecini tetikleyebilecek bir durumdur."},{"q":"Nöbet görevi ücretlendiriliyor mu?","a":"İncelediğimiz Ortaöğretim Kurumları Yönetmeliği ve İlköğretim Kurumları Yönetmeliği'nde nöbet görevine ilişkin ayrı bir ücretlendirme hükmüne rastlamadık; ek ders ücreti gibi konular farklı bir mevzuatın (ilgili Bakanlar Kurulu/Cumhurbaşkanlığı kararları) kapsamına girebilir. Bu, bu yazının doğrulayabildiği kaynakların dışında kalan bir konudur."},{"q":"Yeni açılan bir okulda nöbet esasları nasıl belirlenir?","a":"Yönetmelik, okulun yeni ya da eski olmasına göre ayrı bir hüküm içermiyor; süreç aynıdır — esaslar öğretmenler kurulunda görüşülür, müdür onaylar, yazılı duyurulur. Yeni okulda geçmiş nöbet verisi olmaması, adil dağılım açısından ayrı bir pratik zorluk olsa da yönetmeliğin öngördüğü usulü değiştirmez."},{"q":"Bu yazıdaki bilgiler ne kadar güncel?","a":"Bu yazı, hazırlandığı tarihte erişilebilen resmî yönetmelik metinlerine (madde numaraları ve son görülen değişiklik tarihleriyle birlikte kaynaklar bölümünde belirtilmiştir) dayanmaktadır. Yönetmelikler zaman içinde değişebileceğinden, kritik kararlar öncesinde güncel metni mevzuat.gov.tr üzerinden teyit etmenizi öneririz."}]$faqjson$::jsonb,
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
