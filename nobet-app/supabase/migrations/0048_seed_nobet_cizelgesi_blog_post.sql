-- Yeni blog yazısı: "Nöbet Çizelgesi Hazırlamadan Önce Bilinmesi Gerekenler"
-- (/blog/nobet-cizelgesi-hazirlamadan-once-bilinmesi-gerekenler). content/faq büyük ve tırnak/apostrof yoğun metinler
-- olduğu için dolar-tırnaklama ($article$...$article$) kullanılıyor —
-- tek tık escape hatasına karşı en güvenli yöntem. on conflict (slug)
-- ile idempotent: migration tekrar çalışsa da satır çoğalmaz, günceller.
insert into public.blog_posts (
  slug, title, excerpt, content, status, category, tags,
  meta_title, meta_description, faq, published_at
) values (
  'nobet-cizelgesi-hazirlamadan-once-bilinmesi-gerekenler',
  'Nöbet Çizelgesi Hazırlamadan Önce Bilinmesi Gerekenler',
  $excerpt$Nöbet çizelgesi hazırlamadan önce öğretmen listesi, nöbet bölgeleri, adil dağılım kuralları ve en sık yapılan hatalar için adım adım bir rehber.$excerpt$,
  $article$<p>Ekim ayının ilk haftasıydı. Bir Anadolu lisesinde müdür yardımcılığı yapan bir arkadaşım, öğretmenler kurulundan bir gün sonra beni aradı: "Nöbet çizelgesini üçüncü kez baştan yazıyorum" dedi. Sebep basitti ama can sıkıcıydı — bir öğretmen sağlık raporu getirmiş, bir diğeri görevlendirmeyle başka bir kuruma geçmiş, ayrıca iki öğretmen aynı gün art arda iki kez nöbete denk gelmiş ve konu öğretmenler odasında tartışma konusu olmuştu. Elindeki Excel dosyası artık kime hangi rengin ne anlama geldiğini bile hatırlatmıyordu.</p>

<p>Bu hikaye, aslında Türkiye'deki yüzlerce okulda her eğitim-öğretim yılı başında tekrar eden bir senaryo. Nöbet çizelgesi hazırlamak, kağıt üzerinde basit bir işlem gibi görünür: bir liste, birkaç bölge, bir de takvim. Ama işin içine öğretmen sayısı arttıkça, branş kısıtları, izinler, raporlar ve "adil olma" beklentisi eklendikçe, iş birdenbire haftalarca süren, sürekli güncellenmesi gereken ve herkesi memnun etmesi neredeyse imkansız bir uğraşa dönüşüyor.</p>

<p>Bu yazıda, <strong>nöbet çizelgesi hazırlamadan önce bilinmesi gerekenler</strong> konusunu adım adım ele alıyoruz. Amaç, çizelgeyi oluşturmaya oturduğunuzda karşınıza çıkacak sorunları önceden görebilmenizi sağlamak. Okulunuzda ister Excel, ister Word, ister başka bir sistem kullanın, aşağıdaki hazırlık adımlarını atlarsanız çizelge er ya da geç yeniden yazılmak zorunda kalır.</p>

<div class="mkt-card" style="margin: 24px 0;">
  <p style="margin: 0 0 10px; font-weight: 700; color: var(--text);">İçindekiler</p>
  <ol style="margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: 14px;">
    <li><a href="#neden-planlama">Nöbet Çizelgesi Hazırlamadan Önce Neden Planlama Yapılmalı?</a></li>
    <li><a href="#ogretmen-listesi">Öğretmen Listesinin Eksiksiz Hazırlanması</a></li>
    <li><a href="#nobet-bolgeleri">Nöbet Bölgelerinin Belirlenmesi</a></li>
    <li><a href="#haftalik-planlama">Haftalık Nöbet Günlerinin Planlanması</a></li>
    <li><a href="#muaf-ogretmenler">Nöbetten Muaf Öğretmenlerin Belirlenmesi</a></li>
    <li><a href="#adil-dagilim">Adil Dağılım Yapabilmek İçin Hangi Bilgiler Gerekir?</a></li>
    <li><a href="#sik-hatalar">En Sık Yapılan Hazırlık Hataları</a></li>
    <li><a href="#excel-problemleri">Excel İle Hazırlarken Yaşanan Problemler</a></li>
    <li><a href="#word-eksikleri">Word İle Hazırlamanın Eksikleri</a></li>
    <li><a href="#hazirlik-etkisi">Neden Hazırlık Aşaması Bütün Süreci Etkiler?</a></li>
    <li><a href="#okulnobet-cozumu">OkulNöbet Bu Süreci Nasıl Kolaylaştırıyor?</a></li>
    <li><a href="#sss">Sık Sorulan Sorular</a></li>
  </ol>
</div>

<h2 id="neden-planlama">Nöbet Çizelgesi Hazırlamadan Önce Neden Planlama Yapılmalı?</h2>
<p>Çoğu okulda nöbet çizelgesi, öğretmenler kurulu toplantısının hemen ardından, "bir an önce asalım" refleksiyle hazırlanır. Oysa çizelge hazırlamadan önce yapılan 2-3 günlük bir planlama, sonraki 2-3 haftalık düzeltme telaşını ortadan kaldırır. Planlamadan doğrudan çizelgeye geçmek, inşaata temelsiz başlamak gibidir — duvarlar bir süre ayakta durur, ama ilk sorunda hepsi yeniden örülür.</p>
<p>Planlama aşaması aslında üç soruya cevap bulmaktır: Kim nöbet tutabilir? Nerede nöbet tutulması gerekiyor? Hangi kurallara göre dağıtım yapılacak? Bu üç soru netleşmeden hazırlanan bir çizelge, ilk itirazda geri dönüp yeniden yazılır. Aşağıdaki bölümlerde bu üç soruyu sırayla açıyoruz.</p>

<table>
  <thead><tr><th>Hazırlık Yapılmadan</th><th>Planlı Hazırlıkla</th></tr></thead>
  <tbody>
    <tr><td>Çizelge 2-3 kez baştan yazılır</td><td>Çizelge bir kez hazırlanır, küçük güncellemelerle devam eder</td></tr>
    <tr><td>İtirazlar toplantı sonrası ortaya çıkar</td><td>İtirazların çoğu hazırlık aşamasında önlenir</td></tr>
    <tr><td>Kim kaç kez nöbet tuttu bilinmez</td><td>Dağılım kayıt altında, adalet tartışması azalır</td></tr>
    <tr><td>Değişiklik olduğunda tüm çizelge etkilenir</td><td>Değişiklik yalnızca ilgili hücreyi etkiler</td></tr>
  </tbody>
</table>

<div class="alert alert-info" style="margin: 20px 0;"><strong>İpucu:</strong> Çizelgeyi hazırlamaya başlamadan önce, geçen yılki çizelgeyi ve o yıl yaşanan şikayetleri gözden geçirin. Geçen yıl "adaletsiz" bulunan noktalar, bu yılki planlamanın başlangıç noktası olmalı.</div>

<h2 id="ogretmen-listesi">Öğretmen Listesinin Eksiksiz Hazırlanması</h2>
<p>Nöbet çizelgesindeki hataların büyük bölümü, aslında çizelgenin kendisinden değil, öğretmen listesinin eksik ya da güncel olmamasından kaynaklanır. Eylül ayında hazırlanan bir liste, ekim ayında artık doğru değildir — çünkü öğretmen ataması, ayrılışı, geçici görevlendirmesi eğitim-öğretim yılı boyunca sürer.</p>
<h3>Listede Mutlaka Yer Alması Gereken Öğretmen Grupları</h3>
<ul>
  <li><strong>Kadrolu öğretmenler:</strong> Listenin çekirdeğini oluşturur, ama "kadrolu = her zaman müsait" anlamına gelmez; kadrolu bir öğretmenin de raporlu, izinli ya da başka bir görevle meşgul olduğu dönemler vardır.</li>
  <li><strong>Sözleşmeli öğretmenler:</strong> Branş ve ders yükü kadrolu öğretmenlerden farklı olabilir; bazı okullarda sözleşmeli öğretmenlerin nöbet yükümlülüğü konusunda idareler arasında farklı uygulamalar görülür, bu yüzden okul yönetiminin kendi içinde net bir karar alması gerekir.</li>
  <li><strong>Ücretli öğretmenler:</strong> Genellikle sınırlı saatte okulda bulunurlar. Sadece ders saatlerinde okulda olan bir öğretmeni tam güne yayılan bir nöbet bölgesine yazmak, pratikte uygulanamayan bir çizelge üretir.</li>
  <li><strong>Görevlendirme ile gelen öğretmenler:</strong> Geçici süreliğine okulda bulunurlar. Görevlendirme süresi çizelge dönemini kapsamıyorsa, o öğretmeni sisteme dahil etmek daha sonra çizelgenin ortasında bir boşluk açar.</li>
</ul>
<p>Pratikte önerilen yöntem, listeyi hazırlarken her öğretmenin adının yanına "ne zamana kadar bu okulda" bilgisini not düşmektir. Bu tek satırlık bilgi, dönem ortasında yaşanan "bu öğretmen zaten ayrılmıştı" sürprizlerinin çoğunu önler.</p>

<div class="mkt-card" style="margin: 20px 0; border-left: 3px solid var(--text-muted); padding-left: 16px;"><strong>Not:</strong> Bazı okullarda idari personel (rehber öğretmen, atölye şefi gibi) de nöbet listesine dahil edilir. Bu, okulun kendi iç kararına bağlıdır; önemli olan listeye kimin dahil edildiğinin başlangıçta net şekilde yazılı hale getirilmesidir.</div>

<h2 id="nobet-bolgeleri">Nöbet Bölgelerinin Belirlenmesi</h2>
<p>Öğretmen listesi kadar kritik olan ikinci konu, nöbet tutulacak alanların net şekilde tanımlanmasıdır. "Koridor nöbeti" gibi genel bir ifade, hangi katın hangi koridoru olduğu belirtilmediğinde farklı öğretmenler tarafından farklı yorumlanabilir. Okul büyüklüğüne göre değişmekle birlikte, sık kullanılan nöbet bölgeleri şunlardır:</p>
<ul>
  <li>Bahçe</li>
  <li>Koridor (kat bazında ayrı ayrı)</li>
  <li>Kantin</li>
  <li>Giriş (ana kapı / nöbetçi masası)</li>
  <li>Yemekhane</li>
  <li>Merdiven</li>
  <li>Spor salonu</li>
  <li>Laboratuvar</li>
</ul>
<p>Bu bölgelerin her biri aynı yoğunlukta değildir. Teneffüs sırasında kantin ve bahçe genellikle en yoğun alanlardır; laboratuvar ya da spor salonu ise yalnızca o alanların kullanıldığı saatlerde nöbet gerektirebilir. Bölgeleri tanımlarken yoğunluk farkını da not etmek, ileride "bana hep zor bölge veriliyor" itirazlarına karşı somut bir referans sağlar.</p>
<p>Bina büyük ve kalabalıksa bölgeleri kat bazında ayırmak (örneğin "1. kat koridoru", "2. kat koridoru") daha sağlıklı sonuç verir. Küçük bir okulda ise aşırı bölünmüş bir bölge listesi, gereğinden fazla öğretmen gerektirir ve dağılımı zorlaştırır.</p>

<h2 id="haftalik-planlama">Haftalık Nöbet Günlerinin Planlanması</h2>
<p>Öğretmen listesi ve bölgeler netleştikten sonra sıra, haftanın hangi gününde kimin nöbetçi olacağının planlanmasına gelir. Burada gözden kaçan bir detay, öğretmenlerin haftalık ders programıdır — bir öğretmenin o gün son dersi yoksa ya da ilk dersi geç başlıyorsa, o günkü nöbet ona daha uygun olabilir; tam tersi durumda ise nöbet o öğretmen için pratik bir yük haline gelir.</p>
<p>Haftalık planlamada dikkat edilmesi gereken bir diğer nokta, aynı öğretmenin hep aynı güne denk gelmemesidir. Örneğin bir öğretmen sürekli pazartesi günlerine yazılırsa, dönem sonunda "ben hep pazartesi nöbetteyim, adaletsizlik var" şikayeti kaçınılmaz olur — dönme (rotasyon) düzeni tam olarak bunu önlemek için vardır.</p>
<p>Haftalık ve aylık dönme arasında tercih yaparken okul büyüklüğü belirleyicidir: öğretmen sayısı fazlaysa haftalık dönme daha adil bir dağılım sağlar; öğretmen sayısı azsa aylık dönme, sık değişimin yarattığı karışıklığı azaltır.</p>
<p>Resmi tatiller ve ara tatiller de bu planlamanın bir parçası olmalı. Bir okul, dönme sırasını tatil haftalarını da sayarak ilerletirse, tatil sonrası dönen öğretmenler sıranın nerede kaldığını takip etmekte zorlanır ve "benim sıram atlandı" itirazları ortaya çıkar. MEB tatil takvimini planlamanın başında elinizin altına almak, bu tür karışıklıkları büyük ölçüde önler.</p>

<h2 id="muaf-ogretmenler">Nöbetten Muaf Öğretmenlerin Belirlenmesi</h2>
<p>Her okulda, çeşitli gerekçelerle nöbetten tamamen ya da kısmen muaf tutulan öğretmenler bulunur. Bunun ayrıntılı yönetmelik hükümlerine girmeden bilinmesi gereken genel çerçevesi şudur: hamilelik, sağlık raporu, engellilik durumu veya idarenin okul içi politikası gereği bazı öğretmenler nöbet listesinden kısmen ya da tamamen çıkarılabilir.</p>
<p>Bu bilginin çizelge hazırlanmadan önce netleşmesi kritik, çünkü muafiyet bilgisi sonradan eklenirse, o öğretmenin daha önce üstlendiği nöbetlerin yeniden dağıtılması gerekir ve bu da zincirleme bir güncelleme sürecine yol açar.</p>

<div class="alert alert-warning" style="margin: 20px 0;"><strong>Dikkat:</strong> Muafiyet durumları eğitim-öğretim yılı içinde değişebilir (örneğin bir öğretmen dönem ortasında rapor alabilir). Çizelgeyi hazırlarken kullandığınız yöntem, bu tür bir değişikliği tüm çizelgeyi bozmadan uygulayabilmelidir. Aksi halde her değişiklik, baştan yazma anlamına gelir.</div>

<h2 id="adil-dagilim">Adil Dağılım Yapabilmek İçin Hangi Bilgiler Gerekir?</h2>
<p>Öğretmenler arasında en çok tartışılan konu, nöbetin "adil" dağıtılıp dağıtılmadığıdır. Adaletin öznel bir kavram olduğu doğru, ama somut verilerle desteklenen bir dağılım, itirazların büyük kısmını daha başlamadan söndürür. Adil bir dağılım için takip edilmesi gereken dört temel veri şunlardır:</p>
<ul>
  <li><strong>Geçmiş nöbetler:</strong> Bir öğretmenin önceki dönemde kaç kez, hangi bölgede nöbet tuttuğu bilgisi olmadan "sıra sende" demek mümkün değildir.</li>
  <li><strong>Aynı gün nöbetleri:</strong> Bir öğretmenin aynı gün içinde birden fazla bölgede nöbetçi yazılması, hem fiziksel olarak imkansızdır hem de en sık rastlanan çizelge hatalarından biridir.</li>
  <li><strong>Üst üste görevler:</strong> Bir öğretmenin art arda gelen günlerde sürekli nöbetçi olması, dönme mantığını bozar ve yorgunluk şikayetlerine yol açar.</li>
  <li><strong>Aynı bölge tekrarları:</strong> Her zaman aynı öğretmenin aynı zor bölgeye (örneğin kantin) yazılması, "bana hep zor olan veriliyor" algısını güçlendirir.</li>
</ul>
<p>Bu dört veriyi elle takip etmek — özellikle 40-50 öğretmenli bir okulda — pratikte çok zaman alır. Excel'de ayrı bir sekmede "kim kaç kez nöbet tuttu" tablosu tutan idareciler bile, dönem ortasında bu tabloyu güncel tutmakta zorlandıklarını söylüyor.</p>

<div class="alert alert-info" style="margin: 20px 0;"><strong>İpucu:</strong> Dağılımı yaparken yalnızca "kaç kez nöbet tuttu" sayısına değil, hangi bölgede tuttuğuna da bakın. On kez kolay bir bölgede nöbet tutmuş biriyle on kez kantin nöbeti tutmuş biri, sayısal olarak eşit ama fiilen eşit değildir.</div>

<h2 id="sik-hatalar">En Sık Yapılan Hazırlık Hataları</h2>
<p>Yıllar içinde okullarda tekrar eden hazırlık hataları büyük ölçüde benzer. En sık karşılaşılanları şöyle sıralayabiliriz:</p>
<ul>
  <li><strong>Güncel olmayan öğretmen listesiyle başlamak:</strong> Ayrılan ya da yeni gelen öğretmenler listeye yansıtılmadan çizelge hazırlanır.</li>
  <li><strong>Branş uyuşmazlığını göz ardı etmek:</strong> Bazı bölgeler (örneğin laboratuvar, atölye) belirli branşlardan öğretmen gerektirebilir; bu ayrım yapılmadan rastgele atama yapılır.</li>
  <li><strong>Aynı öğretmeni aynı gün iki bölgeye yazmak:</strong> Özellikle elle hazırlanan çizelgelerde en sık rastlanan hatalardan biridir.</li>
  <li><strong>İzin/rapor bilgisini çizelgeye yansıtmamak:</strong> Nöbet günü geldiğinde o öğretmenin zaten izinli olduğu fark edilir ve son anda yeniden dağıtım yapılır.</li>
  <li><strong>Dönem başında bir kez hazırlayıp bir daha güncellememek:</strong> Çizelge canlı bir belgedir; okulda değişen her şey (yeni öğretmen, ayrılan öğretmen, rapor) çizelgeye yansıtılmalıdır.</li>
  <li><strong>Kağıt üzerinde iyi görünen ama fiilen uygulanamayan dağılım yapmak:</strong> Örneğin sadece iki gün okulda bulunan bir ücretli öğretmeni beş günlük bir nöbet bölgesine sabitlemek.</li>
</ul>

<h2 id="excel-problemleri">Excel İle Hazırlarken Yaşanan Problemler</h2>
<p>Excel, nöbet çizelgesi hazırlamak için en yaygın kullanılan araçtır — çünkü hemen hemen her okulda kurulu, tanıdık ve "hazır" görünür. Ama küçük bir tablo olmaktan çıkıp 40-50 öğretmenli, 8-10 bölgeli bir çizelgeye dönüştüğünde, Excel'in sınırları hızla ortaya çıkar.</p>
<h3>Gerçek Bir Örnek</h3>
<p>150 öğretmenli bir lisede müdür yardımcısı olan bir okul idarecisinin anlattığı örnek şöyleydi: Ekim ayı ortasında üç öğretmen aynı hafta içinde rapor almış, aynı anda bir öğretmen de görevlendirmeyle ilçeye geçici olarak gönderilmişti. Excel dosyasında bu dört değişikliği yansıtmak için sırasıyla 12 hücre elle güncellenmiş, ama güncelleme sırasında iki hücre birbirine karışmış ve sonuçta bir öğretmen aynı gün iki bölgede nöbetçi görünmüştü. Hata ancak nöbet listesi öğretmenler odasına asıldıktan sonra fark edilmişti.</p>
<p>Bu örnek aslında Excel'in en büyük zaafını gösteriyor: <strong>hücreler birbirinden bağımsızdır.</strong> Bir hücreyi değiştirdiğinizde, o değişikliğin diğer hücrelerle çelişip çelişmediğini sistem size söylemez — bunu siz, gözle kontrol ederek bulmak zorundasınızdır. Öğretmen sayısı arttıkça bu gözle kontrol işi de aynı oranda zorlaşır.</p>
<p>Excel'de sık karşılaşılan diğer problemler:</p>
<ul>
  <li>Formül veya renk kodlamasıyla kurulan "adil dağılım" mantığı, bir öğretmen eklendiğinde ya da çıkarıldığında bozulur ve elle yeniden kurulması gerekir.</li>
  <li>Kim kaç kez nöbet tuttu bilgisini ayrı bir sekmede tutmak, o sekmenin de manuel güncellenmesini gerektirir — genellikle ikisi birbirinden kopar.</li>
  <li>Birden fazla kişi aynı dosya üzerinde çalıştığında (örneğin müdür yardımcısı ve zümre başkanı), versiyon karmaşası yaşanır; "hangisi son hali" sorusu ortaya çıkar.</li>
  <li>Yazdırıldığında sütunlar sayfaya sığmaz, renkler yazıcıda gri tonlara döner ve okunabilirlik düşer.</li>
  <li>Dosya e-posta veya USB ile taşındığında farklı bilgisayarlarda farklı Excel sürümleri farklı görünüm sorunları çıkarabilir; bir bilgisayarda düzgün görünen tablo, başka birinde kaymış olarak açılabilir.</li>
</ul>

<table>
  <thead><tr><th></th><th>Excel</th><th>Word</th><th>OkulNöbet</th></tr></thead>
  <tbody>
    <tr><td>Kural kontrolü (branş, çift nöbet vb.)</td><td>Yok — elle kontrol gerekir</td><td>Yok</td><td>Otomatik</td></tr>
    <tr><td>Geçmiş nöbet takibi</td><td>Ayrı, manuel tablo gerekir</td><td>Yok</td><td>Sistem kendisi tutar</td></tr>
    <tr><td>Değişiklik sonrası güncelleme</td><td>İlgili tüm hücreler elle kontrol edilir</td><td>Tüm belge elden geçirilir</td><td>İlgili atama güncellenir, kurallar yeniden uygulanır</td></tr>
    <tr><td>Çıktı formatı</td><td>Yazdırmada sütun/renk sorunu</td><td>Resmi evrak formatına elle uydurulur</td><td>Yazdırmaya hazır, imza bölümlü format</td></tr>
  </tbody>
</table>

<h2 id="word-eksikleri">Word İle Hazırlamanın Eksikleri</h2>
<p>Bazı okullarda çizelge doğrudan Word'de, tablo olarak hazırlanır — genellikle çıktının resmi evrak görünümüne daha kolay uyması için. Word'ün buradaki avantajı yazdırma düzenidir, ama nöbet planlamasının kendisi için Word hiçbir hesaplama ya da kural kontrolü sunmaz.</p>
<p>Word'de bir tabloyu güncellemek, satır/sütun kaymasına çok açıktır: bir öğretmen ismini sildiğinizde ya da bir satır eklediğinizde, tablonun geri kalanı da kaymaya başlayabilir. Ayrıca Word'de "bu öğretmen bu ay kaç kez nöbet tuttu" gibi bir soruya cevap almanın hiçbir otomatik yolu yoktur — bu bilgiyi ayrı bir yerde, genellikle kağıt üzerinde ya da zihinsel olarak takip etmek gerekir.</p>
<p>Kısacası Word, "sonuç belgesi" üretmek için iyi bir araçtır ama "planlama" için tasarlanmamıştır. Çoğu okul idarecisi aslında planlamayı zihninde ya da bir kağıtta yapıp, sonucu Word'e yalnızca yazdırmak için aktarır.</p>

<h2 id="hazirlik-etkisi">Neden Hazırlık Aşaması Bütün Süreci Etkiler?</h2>
<p>Buraya kadar anlatılan tüm adımların ortak noktası şu: nöbet çizelgesinde çıkan sorunların büyük kısmı, çizelgenin kendisinde değil, hazırlık aşamasında atlanan bir adımda gizlidir. Eksik bir öğretmen listesi, net tanımlanmamış bir bölge, gözden kaçmış bir muafiyet — bunların her biri, çizelge asıldıktan sonra bir düzeltme talebi olarak geri döner.</p>
<p>Bu yüzden "nöbet çizelgesi hazırlamadan önce bilinmesi gerekenler" başlığı aslında bir öncelik sıralamasıdır: önce doğru veri (kim, nerede, hangi kurala göre), sonra dağıtım. Sıra tersine çevrildiğinde — yani önce dağıtım yapılıp veriler sonradan tamamlanmaya çalışıldığında — ortaya çıkan sonuç, sürekli yama yapılan, hiçbir zaman "bitmiş" hissi vermeyen bir çizelge oluyor.</p>
<p>Bunu bir başka açıdan da değerlendirmek mümkün: hazırlık aşamasında harcanan her ek yarım saat, dönem içinde harcanacak birkaç saatlik düzeltme zamanını önlüyor. Bir müdür yardımcısının bir dönem boyunca nöbet çizelgesiyle ilgili yaptığı iş, tek seferlik bir hazırlıktan ibaret değil; her hafta gelen "ben o gün izinliydim", "bu bölge bana geçen ay da düşmüştü" gibi soruları yanıtlamak da bu işin bir parçası. Hazırlık aşaması ne kadar sağlam kurulursa, dönem içindeki bu tekil soru sayısı da o kadar azalıyor.</p>

<table>
  <thead><tr><th></th><th>Manuel Süreç</th><th>Otomatik Süreç</th></tr></thead>
  <tbody>
    <tr><td>Hazırlık süresi</td><td>Günler, bazen haftalar</td><td>Dakikalar</td></tr>
    <tr><td>Değişiklik sonrası tekrar hazırlık</td><td>Genellikle çizelgenin büyük kısmı yeniden gözden geçirilir</td><td>Yalnızca ilgili kayıt güncellenir</td></tr>
    <tr><td>Adil dağılım kontrolü</td><td>Kişinin hafızasına veya ayrı notlara bağlı</td><td>Geçmiş veriler üzerinden sistem tarafından uygulanır</td></tr>
  </tbody>
</table>

<h2 id="okulnobet-cozumu">OkulNöbet Bu Süreci Nasıl Kolaylaştırıyor?</h2>
<p>Bu yazıda anlatılan hazırlık adımlarının her biri — öğretmen listesi, nöbet bölgeleri, kurallar, adil dağılım verileri — aslında OkulNöbet'in de bir okulu sisteme dahil ederken sorduğu sorularla birebir örtüşüyor. Fark şu: bu bilgileri bir kez tanımladıktan sonra, geri kalan hesaplamayı elle değil, sistem üzerinden yapıyorsunuz.</p>
<p>Pratikte işleyiş şöyle: öğretmenleri tek tek elle girmek yerine MEB teşkilat şemasından otomatik aktarabiliyorsunuz. Ardından okulunuzun nöbet bölgelerini (bahçe, koridor, kantin gibi) bir kere tanımlıyorsunuz. Branş kısıtı, çift nöbet yasağı, izinli/raporlu öğretmen gibi kuralları belirledikten sonra, sistem geçmiş nöbetleri ve tanımladığınız kuralları dikkate alarak adil bir rotasyonla çizelgeyi otomatik oluşturuyor. Bir öğretmen rapor aldığında ya da yeni biri göreve başladığında, çizelgenin tamamını değil, yalnızca ilgili kısmı güncelliyorsunuz — kurallar otomatik olarak yeniden uygulanıyor.</p>
<p>Çizelge hazır olduğunda Word çıktısı alıp doğrudan öğretmenler odasına asabiliyorsunuz; elle kilitlemek istediğiniz hücreler varsa (örneğin belirli bir öğretmenin belirli bir günde nöbetçi olmasını istiyorsanız) bunu da yapabiliyorsunuz, sistem geri kalanını o kilide göre dağıtıyor.</p>

<div class="mkt-card" style="margin: 20px 0; border-left: 3px solid var(--text-muted); padding-left: 16px;"><strong>Not:</strong> Bu yazının amacı bir ürünü övmek değil, hazırlık sürecinde nelerin gözden kaçtığını göstermek. Excel veya Word ile de dikkatli bir hazırlık yapılırsa çizelge işler; fark, o dikkatin ne kadar zamana ve tekrar kontrole ihtiyaç duyduğudur.</div>

<p>Sonuç olarak, nöbet çizelgesi hazırlığında zaman kaybının büyük kısmı, elle yapılan tekrar eden kontrollerden kaynaklanıyor: kim kaç kez nöbet tuttu, kim aynı gün iki yere yazılmış, kim raporluydu ama listede hâlâ görünüyor. Bu kontrolleri bir sisteme bırakmak, hazırlık sürecini günler yerine dakikalara indiriyor.</p>

<div class="mkt-card" style="text-align: center; margin: 40px 0 8px; padding: 36px 28px;">
  <h2 style="margin: 0 0 12px;">Nöbet çizelgenizi hazırlamaya dakikalar içinde başlayın.</h2>
  <p style="color: var(--text-muted); margin: 0 0 24px; font-size: 15px; line-height: 1.7;">
    Öğretmenleri MEB teşkilat şemasından otomatik aktarın. Nöbet bölgelerinizi oluşturun. Kurallarınızı belirleyin.
    Adil nöbet çizelgenizi birkaç dakika içinde oluşturun. Word olarak yazdırın ve panoya asın.
  </p>
  <a href="/signup" class="mkt-btn mkt-btn-primary mkt-btn-lg">Ücretsiz Başla</a>
</div>$article$,
  'published',
  'Nöbet Yönetimi',
  array['öğretmen nöbet çizelgesi', 'nöbet çizelgesi', 'okul nöbet programı', 'adil nöbet dağılımı', 'nöbet planlama', 'meb nöbet'],
  null,
  $meta$Nöbet çizelgesi hazırlamadan önce bilinmesi gerekenler: öğretmen listesi, nöbet bölgeleri, adil dağılım kuralları ve sık yapılan hazırlık hataları.$meta$,
  $faqjson$[{"q":"Nöbet çizelgesi hazırlamaya ne zaman başlanmalı?","a":"Öğretmenler kurulu toplantısından hemen sonra değil, ondan birkaç gün önce başlamak daha sağlıklı sonuç verir. Bu sayede öğretmen listesi, nöbet bölgeleri ve kurallar netleşmiş olur; toplantıda çizelge üzerinde yalnızca son onay alınır. Dönem başında aceleyle hazırlanan çizelgeler, ilk iki hafta içinde genellikle en az bir kez yeniden düzenlenmek zorunda kalır."},{"q":"Nöbet çizelgesi kaç günde hazırlanır?","a":"Bu, okulun büyüklüğüne ve hazırlık yöntemine göre değişir. Elle (Excel/Word) hazırlanan bir çizelge, 40-50 öğretmenli bir okulda genellikle 2-4 iş günü sürer; buna geçmiş nöbetlerin kontrolü ve itirazların değerlendirilmesi dahildir. Öğretmen bilgilerinin ve kuralların önceden tanımlandığı otomatik sistemlerde bu süre dakikalar seviyesine iner."},{"q":"Nöbet listesine hangi öğretmenler dahil edilmeli?","a":"Kadrolu, sözleşmeli ve ücretli öğretmenler ile geçici görevlendirmeyle okulda bulunan öğretmenler değerlendirmeye alınmalıdır. Ancak her grubun nöbet yükümlülüğü aynı olmayabilir; örneğin ücretli bir öğretmen yalnızca ders saatlerinde okulda bulunuyorsa, tüm gün süren bir nöbet bölgesine yazılması pratikte uygulanamaz. Okul yönetiminin bu ayrımı baştan netleştirmesi gerekir."},{"q":"Ücretli öğretmenler nöbete girer mi?","a":"Bu konuda tek bir kural yerine okulun kendi uygulaması belirleyicidir. Genel eğilim, ücretli öğretmenlerin yalnızca okulda fiilen bulundukları saatlerde ve o saatlere uygun bölgelerde nöbete dahil edilmesidir. Tüm gün okulda olmayan bir öğretmeni sabah veya öğleden sonraya sabitlemek, çizelgenin fiilen uygulanamamasına yol açar."},{"q":"Nöbetten muaf olan öğretmenler kimlerdir?","a":"Sağlık raporu, hamilelik, engellilik durumu gibi gerekçelerle bazı öğretmenler kısmen ya da tamamen nöbetten muaf tutulabilir. Muafiyet kapsamı okuldan okula ve yönetmelik hükümlerine göre değişebileceğinden, bu yazı genel bir çerçeve sunar; kesin uygulama için okul idaresinin güncel mevzuatı ve resmi yazışmaları esas alması gerekir."},{"q":"Nöbet bölgeleri nasıl belirlenir?","a":"Okulun fiziksel yapısına göre bahçe, koridor, kantin, giriş, yemekhane, merdiven, spor salonu ve laboratuvar gibi alanlar tanımlanır. Büyük binalarda koridorları kat bazında ayırmak, küçük okullarda ise gereğinden fazla bölünmemiş bir liste kullanmak daha uygulanabilir bir dağılım sağlar. Yoğunluğu yüksek alanların (kantin, bahçe gibi) ayrıca not edilmesi, adil dağılım tartışmalarını azaltır."},{"q":"Adil nöbet dağılımı için hangi veriler tutulmalı?","a":"Dört temel veri takip edilmelidir: bir öğretmenin geçmişte kaç kez ve hangi bölgede nöbet tuttuğu, aynı gün birden fazla bölgeye yazılıp yazılmadığı, art arda günlerde nöbete denk gelip gelmediği ve sürekli aynı (özellikle yoğun) bölgeye atanıp atanmadığı. Bu verilerin elle takibi öğretmen sayısı arttıkça zorlaşır."},{"q":"Excel ile nöbet çizelgesi hazırlamak yeterli mi?","a":"Küçük öğretmen sayısına sahip okullarda dikkatli bir hazırlıkla Excel yeterli olabilir. Ancak öğretmen sayısı ve bölge sayısı arttıkça, hücreler arasında otomatik bir kural kontrolü olmadığı için hatalar (aynı öğretmenin aynı gün iki bölgeye yazılması gibi) gözden kaçabilir. Bu hataların çoğu, çizelge asıldıktan sonra fark edilir."},{"q":"Nöbet çizelgesi hazırlarken en sık yapılan hata nedir?","a":"En sık rastlanan hata, güncel olmayan bir öğretmen listesiyle çalışmaya başlamaktır. Ayrılan, yeni gelen ya da rapor alan öğretmenler listeye yansıtılmadan hazırlanan çizelgeler, asıldıktan kısa süre sonra düzeltme gerektirir. İkinci sık hata ise bir öğretmenin aynı gün birden fazla bölgeye yazılmasıdır."},{"q":"Nöbet çizelgesi değişiklik gerektirirse ne yapılmalı?","a":"Değişikliğin yalnızca ilgili kısmı etkilemesi hedeflenmelidir. Elle hazırlanan çizelgelerde bir değişiklik genellikle birden fazla hücreyi etkiler ve tamamının yeniden kontrol edilmesini gerektirir. Bu yüzden hazırlık aşamasında kullanılan yöntemin, tekil bir güncellemeyi tüm çizelgeyi bozmadan uygulayabilmesi önemlidir."},{"q":"Nöbet çizelgesi hazırlarken MEB mevzuatına nasıl uyulur?","a":"Bu yazı, hazırlık sürecindeki pratik adımlara odaklanır; nöbet görevine ilişkin güncel yönetmelik hükümleri zaman zaman güncellenebildiğinden, kesin ve bağlayıcı bilgi için okul idaresinin ilgili resmi mevzuatı ve il/ilçe milli eğitim müdürlüğü duyurularını takip etmesi gerekir."},{"q":"Öğretmen sayısı azken adil dağılım nasıl sağlanır?","a":"Öğretmen sayısı az olduğunda dönme sıklığı doğal olarak artar; bu durumda haftalık yerine aylık dönme düzeni, sık değişimin yarattığı karışıklığı azaltabilir. Az sayıda öğretmenle çalışırken geçmiş nöbet kayıtlarının tutulması, kimin ne zaman nöbete girdiğinin unutulmaması açısından daha da önemli hale gelir."},{"q":"Nöbet çizelgesini dijital araçla hazırlamak zaman kazandırır mı?","a":"Evet — özellikle öğretmen ve bölge sayısı arttıkça kazanılan zaman da artar. Öğretmen listesi ve kurallar bir kez tanımlandıktan sonra, sistem geçmiş nöbetleri dikkate alarak dağılımı otomatik oluşturur; değişiklik durumunda yalnızca ilgili kayıt güncellenir. Bu, hazırlık sürecini günler yerine dakikalara indirir."}]$faqjson$::jsonb,
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
