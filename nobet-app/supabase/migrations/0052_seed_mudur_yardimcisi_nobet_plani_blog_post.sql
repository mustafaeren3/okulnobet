-- Yeni blog yazısı: "Müdür Yardımcısı Nöbet Planı Nasıl Hazırlanır? (Güncel Rehber)"
-- (/blog/mudur-yardimcisi-nobet-plani-nasil-hazirlanir). content/faq dolar-tırnaklama ($article$...$article$)
-- ile ekleniyor — bkz. migration 0048-0051'deki aynı desen/gerekçe.
-- Görevli Müdür Yardımcısı modülü açıklaması gerçek koda dayanıyor:
-- lib/engine/assistantPrincipalRotation.js (sequential_daily/weekly_block/
-- n_day_block), lib/db/assistantPrincipalAssignments.js (is_manual kilit),
-- app/(wizard)/dashboard/scheduleDocument.js (assistantPrincipalColumnMode
-- same_table/separate_table) — uydurma özellik yok.
insert into public.blog_posts (
  slug, title, excerpt, content, status, category, tags,
  meta_title, meta_description, faq, published_at
) values (
  'mudur-yardimcisi-nobet-plani-nasil-hazirlanir',
  'Müdür Yardımcısı Nöbet Planı Nasıl Hazırlanır? (Güncel Rehber)',
  $excerpt$Görevli müdür yardımcısı nöbet planı hazırlarken dikkat edilmesi gerekenler, dönüşüm yöntemleri ve gerçek okul senaryolarıyla bir rehber.$excerpt$,
  $article$<p>Her eğitim-öğretim yılı başında, öğretmen nöbet çizelgesi kadar sık konuşulmayan ama en az onun kadar tekrar eden bir planlama sorunu daha var: müdür yardımcılarının kendi aralarındaki nöbet dönüşümü. Bir Anadolu lisesinde üç müdür yardımcısı görev yapıyordu. Nöbet planları öğretmenler için sorunsuz işliyordu, ama müdür yardımcılarının kendi aralarındaki "kim hangi hafta nöbetçi" düzeni sürekli karışıyordu — çünkü bu üç kişinin planı, öğretmen nöbet çizelgesinden ayrı, kimsenin üzerine almadığı bir kağıt notuyla takip ediliyordu. Bir müdür yardımcısı izne çıktığında, geri kalan ikisi "bu hafta sıra kimdeydi" diye birbirine soruyor, kesin bir cevap bulamıyorlardı.</p>

<p>Müdür yardımcısı nöbet planı, öğretmen nöbet çizelgesiyle aynı mantıkla çalışmaz. Öğretmen nöbetinde onlarca kişi arasında günlük bölge dağılımı yapılırken, müdür yardımcısı planında genellikle 1-4 kişi arasında, daha uzun süreli (gün, hafta ya da birkaç günlük bloklar hâlinde) bir dönüşüm kurulur. Bu farkı gözden kaçırıp öğretmen nöbetiyle aynı yöntemle planlamaya çalışmak, tam da yukarıdaki örnekte olduğu gibi karışıklığa yol açıyor.</p>

<p>Bu yazıda <strong>müdür yardımcısı nöbet planı</strong> hazırlarken nelere dikkat edilmesi gerektiğini, en çok kullanılan dönüşüm yöntemlerini ve bunların avantaj/dezavantajlarını, gerçek okul senaryolarıyla birlikte ele alıyoruz. Amacımız, "hangi yöntemi seçmeliyim" sorusuna tek bir cevap dayatmak değil; okulunuzun büyüklüğüne ve müdür yardımcısı sayınıza göre hangi yaklaşımın daha uygun olabileceğini göstermek.</p>

<div class="mkt-card" style="margin: 24px 0;">
  <p style="margin: 0 0 10px; font-weight: 700; color: var(--text);">İçindekiler</p>
  <ol style="margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: 14px;">
    <li><a href="#gorevli-mudur-yardimcisi-nedir">Görevli Müdür Yardımcısı Nedir?</a></li>
    <li><a href="#dikkat-edilmesi-gerekenler">Müdür Yardımcısı Nöbet Planı Hazırlanırken Dikkat Edilmesi Gerekenler</a></li>
    <li><a href="#planlama-yontemleri">En Çok Kullanılan Planlama Yöntemleri</a></li>
    <li><a href="#manuel-sorunlar">Manuel Plan Hazırlamanın Sorunları</a></li>
    <li><a href="#excel-dezavantajlari">Excel ile Hazırlamanın Dezavantajları</a></li>
    <li><a href="#sik-hatalar">En Sık Yapılan Hatalar</a></li>
    <li><a href="#gercek-senaryolar">Gerçek Okul Senaryoları</a></li>
    <li><a href="#modul">Görevli Müdür Yardımcısı Modülü Bu Süreci Nasıl Kolaylaştırıyor?</a></li>
    <li><a href="#sss">Sık Sorulan Sorular</a></li>
  </ol>
</div>

<h2 id="gorevli-mudur-yardimcisi-nedir">Görevli Müdür Yardımcısı Nedir?</h2>
<p>"Görevli müdür yardımcısı" ifadesi, o gün ya da o dönem okulun nöbet/gözetim düzeninden idari olarak sorumlu olan müdür yardımcısını tanımlar. Birden fazla müdür yardımcısı bulunan okullarda bu sorumluluk tek bir kişide sabit kalmaz; bir dönüşüm (rotasyon) düzenine göre müdür yardımcıları arasında el değiştirir.</p>
<p>Bu görevin amacı, öğretmen nöbetinin sağlıklı işlemesini denetlemek: nöbetçi öğretmenlerin yerinde olup olmadığını kontrol etmek, nöbet raporlarını incelemek, gün içinde ortaya çıkan sorunları (bir nöbetçinin gelmemesi, bir olayın idareye bildirilmesi gerekmesi gibi) ilk elden değerlendirmek. Yani müdür yardımcısı nöbeti, öğretmen nöbetinin üzerine kurulan bir denetim/koordinasyon katmanıdır — öğretmen nöbetinin yerini almaz, onu tamamlar.</p>
<p>Bu iki katmanın (öğretmen nöbeti ve müdür yardımcısı nöbeti) birbirinden farklı ölçekte çalışması, planlama şeklini de kökten değiştiriyor. Öğretmen nöbetinde adil dağılım genellikle "kaç kez, hangi bölgede" sorusuna dayanırken, müdür yardımcısı planında bu iki soru neredeyse hiç gündeme gelmiyor — çünkü zaten sınırlı sayıda kişi arasında, bölge ayrımı olmadan, zaman bazlı (gün/hafta/blok) bir dönüşüm söz konusu. Bu yüzden öğretmen nöbeti için işleyen bir yöntemi doğrudan müdür yardımcısı planına uygulamaya çalışmak genellikle beklenmedik sonuçlar veriyor.</p>
<div class="alert alert-info" style="margin: 20px 0;"><strong>Not:</strong> Bu yazı, görevli müdür yardımcısı planlamasının pratik yönetim boyutuna odaklanıyor. Müdür yardımcılarının nöbetle ilgili resmî görev ve sorumluluklarının hangi yönetmelik maddelerine dayandığını ayrıntılı incelediğimiz <a href="/blog/ogretmen-nobet-yonetmeligi">Öğretmen Nöbet Yönetmeliği</a> yazımıza bakabilirsiniz.</div>

<h2 id="dikkat-edilmesi-gerekenler">Müdür Yardımcısı Nöbet Planı Hazırlanırken Dikkat Edilmesi Gerekenler</h2>
<p>Bir müdür yardımcısı nöbet planı kurarken göz önünde bulundurulması gereken beş temel faktör var:</p>
<ul>
  <li><strong>Günlük görev yükü:</strong> Müdür yardımcılarının nöbet dışındaki idari yükü (evrak işleri, veli görüşmeleri, disiplin süreçleri) eşit dağılmayabilir; nöbet planı bu dengesizliği daha da büyütmemeli.</li>
  <li><strong>Okulun büyüklüğü:</strong> Öğrenci ve öğretmen sayısı arttıkça, o gün görevli müdür yardımcısının karşılaşacağı olay/soru sayısı da artar — büyük okullarda daha kısa dönüşüm süreleri (günlük gibi) daha sık tercih edilir.</li>
  <li><strong>Müdür yardımcısı sayısı:</strong> 2 kişilik bir kadroda dönüşüm çok daha sık tekrarlanırken, 4 kişilik bir kadroda aynı kişiye sıra daha seyrek gelir — bu, hangi dönüşüm yönteminin daha adil hissettirileceğini doğrudan etkiler.</li>
  <li><strong>Devamsızlık ihtimali:</strong> Bir müdür yardımcısı izne çıktığında ya da rapor aldığında planın nasıl toparlanacağı önceden düşünülmeli; aksi hâlde her devamsızlık, elle yeniden düzenleme gerektiren bir krize dönüşür.</li>
  <li><strong>Hafta içi dağılım:</strong> Bazı günler (örneğin toplantı günleri, sınav günleri) diğerlerinden daha yoğun olabilir; dönüşüm sırasının bu yoğun günleri sürekli aynı kişiye denk getirmediğinden emin olunmalı.</li>
</ul>
<div class="alert alert-warning" style="margin: 20px 0;"><strong>Dikkat:</strong> Müdür yardımcısı sayısı azken (örneğin 2 kişi), dönüşüm sıklığı otomatik olarak artar. Bu durumda tek bir devamsızlık, planın yarısını etkileyebilir — bu yüzden küçük kadrolarda "yedek" bir plan (kimin kime nasıl vekalet edeceği) baştan netleştirilmeli.</div>
<p>Bu beş faktörün hiçbiri tek başına "doğru" bir yöntem dayatmıyor; aralarındaki etkileşim önemli. Örneğin müdür yardımcısı sayısı az ama okul büyükse (2 kişi, 1000+ öğrenci), günlük görev yükünün yüksekliği ile devamsızlık riskinin küçük bir kadroda daha ağır hissedilmesi bir arada değerlendirilmeli — bu tür okullarda genellikle daha kısa dönüşüm blokları (günlük ya da ikişer gün) tercih ediliyor, çünkü uzun bir haftalık yük, zaten sınırlı sayıda kişi arasında daha dengesiz hissedilebiliyor.</p>

<h2 id="planlama-yontemleri">En Çok Kullanılan Planlama Yöntemleri</h2>
<p>Müdür yardımcısı nöbet planlarında yaygın olarak dört yaklaşım kullanılır. Her birinin kendine özgü avantaj ve dezavantajları var.</p>

<h3>Her Gün Sırayla Dönüşüm</h3>
<p>Bu yöntemde her aktif okul günü, listedeki bir sonraki müdür yardımcısına geçilir (örneğin Ali, Ayşe, Ali, Ayşe sırasıyla). En basit ve en sık tercih edilen yöntemdir; özellikle 2 müdür yardımcısı olan okullarda "gün aşırı" bir düzen oluşturur.</p>

<h3>Haftalık Dönüşüm</h3>
<p>Bir müdür yardımcısı tüm hafta boyunca görevli kalır, sonraki hafta listede bir sonraki kişiye geçilir. Bu yöntem, o hafta içindeki sorunların (örneğin bir öğrenci disiplin sürecinin) aynı kişi tarafından takip edilmesini kolaylaştırır — çünkü hafta ortasında görevli değişmez.</p>

<h3>İkişer Gün Dönüşüm</h3>
<p>Bir müdür yardımcısı belirlenen sayıda (örneğin iki) ardışık aktif güne kadar görevli kalır, sonra sıradaki kişiye geçilir. Bu, günlük dönüşümün getirdiği sık el değiştirme ile haftalık dönüşümün getirdiği uzun süreli yük arasında bir denge noktası arayan okullar için tercih edilir. Blok süresi (iki gün, üç gün gibi) okulun ihtiyacına göre serbestçe belirlenebilir.</p>

<h3>Özel Okul İhtiyaçlarına Göre Planlama</h3>
<p>Bazı okullarda yukarıdaki üç standart yöntem yerine, okula özgü bir düzen kurulur — örneğin belirli günler (toplantı günü gibi) sabit bir müdür yardımcısına atanır, geri kalan günler dönüşümle dağıtılır. Bu yaklaşım daha fazla elle müdahale gerektirir, ama okulun kendine özgü ihtiyaçlarına (örneğin bir müdür yardımcısının belirli bir alanda uzmanlaşmış olması) daha iyi uyum sağlayabilir.</p>
<p>Bu dördüncü yaklaşımın riski, standart bir kuralı olmadığı için zamanla "kimin ne zaman görevli olduğu" konusunun tamamen idarecinin hafızasına bağlı hâle gelmesi. Özel bir düzen kurmayı tercih eden okullarda bile, bu düzenin en azından yazılı bir kurala (örneğin "salı ve perşembe günleri her zaman X, diğer günler dönüşümle") bağlanması, ileride "bu neden böyleydi" sorularının önüne geçiyor.</p>

<table>
  <thead><tr><th>Yöntem</th><th>Avantaj</th><th>Dezavantaj</th></tr></thead>
  <tbody>
    <tr><td>Her Gün Sırayla</td><td>Basit, öngörülebilir, kısa süreli yük</td><td>Sık el değiştirme, süreklilik gerektiren işlerde kopukluk</td></tr>
    <tr><td>Haftalık Dönüşüm</td><td>Hafta içi süreklilik, daha az el değiştirme</td><td>Yoğun bir haftaya denk gelen kişi için yük dengesiz hissedilebilir</td></tr>
    <tr><td>İkişer Gün (N Günlük Blok)</td><td>Günlük ile haftalık arası esnek denge</td><td>Blok sınırları hafta ortasına denk gelebilir, takvimle uyumu takip gerektirir</td></tr>
    <tr><td>Özel Okul İhtiyacına Göre</td><td>Okula özgü ihtiyaçlara tam uyum</td><td>Elle müdahale ve sürekli takip gerektirir, standart bir kural yok</td></tr>
  </tbody>
</table>

<table>
  <thead><tr><th>Okul Profili</th><th>Sıklıkla Tercih Edilen Yöntem</th></tr></thead>
  <tbody>
    <tr><td>2 müdür yardımcılı küçük/orta okul</td><td>Her gün sırayla</td></tr>
    <tr><td>3-4 müdür yardımcılı büyük okul</td><td>Haftalık ya da ikişer gün dönüşüm</td></tr>
    <tr><td>Yoğun idari iş yükü olan büyük lise</td><td>İkişer gün dönüşüm</td></tr>
    <tr><td>Kendine özgü düzeni olan okul (ör. iki kampüs)</td><td>Özel okul ihtiyacına göre planlama</td></tr>
  </tbody>
</table>

<h2 id="manuel-sorunlar">Manuel Plan Hazırlamanın Sorunları</h2>
<p>Yazının başındaki üç müdür yardımcılı lise örneğinde olduğu gibi, manuel (kağıt üzerinde ya da zihinsel) takip edilen planların en büyük zaafı, <strong>tek bir yerde, herkesin erişebileceği güncel bir kayıt olmaması</strong>. Bir kişi izne çıktığında ya da plan değiştiğinde, bu değişikliğin diğer müdür yardımcılarına ne zaman ve nasıl ulaştığı belirsizleşiyor.</p>
<p>İkinci sorun, dönüşüm sırasının "hafızada" tutulması. Üç kişilik bir dönüşümde sıra takip etmek kolay görünse de, bir tatil haftası araya girdiğinde ya da bir kişi birkaç hafta izinli olduğunda, "sıranın kaldığı yer" konusunda görüş ayrılığı çıkabiliyor — biri "bu hafta bendeydi zaten" derken diğeri farklı hatırlıyor.</p>
<p>Üçüncü sorun ise daha az fark edilen ama uzun vadede etkili bir sorun: manuel takipte "toplam kaç kez görevli olundu" bilgisi genellikle hiç tutulmuyor. Öğretmen nöbetinde bu bilgi adil dağılım tartışmalarında sık başvurulan bir referans olsa da, müdür yardımcısı planlamasında bu veri neredeyse hiç kaydedilmiyor — çünkü sayı azken "zaten sıra herkese eşit geliyor" varsayımıyla hareket ediliyor. Ama bu varsayım, devamsızlıklar ve tatiller birikince yanlış çıkabiliyor; bir müdür yardımcısı, fark edilmeden diğerlerinden belirgin şekilde daha fazla görev almış olabiliyor.</p>

<h2 id="excel-dezavantajlari">Excel ile Hazırlamanın Dezavantajları</h2>
<p>Bazı okullar müdür yardımcısı planını da öğretmen nöbet çizelgesi gibi Excel'de tutmayı dener. Bu, öğretmen çizelgesine kıyasla daha az hücre içerdiği için ilk bakışta daha "yönetilebilir" görünür, ama kendine özgü sorunları var.</p>
<p>En büyük sorun, dönüşüm mantığının (kim, hangi bloğun kaçıncı gününde) Excel'de formülle takip edilmesinin, tatil günleri ve devamsızlıklar araya girdiğinde bozulmasıdır. Örneğin ikişer günlük bir blok ortasında bir tatil haftası araya girerse, "bu blok tatil öncesinden mi sayılıyor, tatil sonrasından mı devam ediyor" sorusu, elle takip edilen bir Excel dosyasında kolayca karışabiliyor.</p>
<p>İkinci sorun, öğretmen nöbet çizelgesiyle aynı belgede yazdırma ihtiyacı ortaya çıktığında yaşanıyor: iki ayrı Excel dosyasını (öğretmen çizelgesi ve müdür yardımcısı planı) tek bir Word çıktısında birleştirmek, elle kopyala-yapıştır gerektiren, hataya açık bir işlem.</p>
<p>Üçüncü sorun, birden fazla kişinin aynı Excel dosyası üzerinde çalışması gerektiğinde ortaya çıkıyor. Öğretmen nöbet çizelgesini genellikle bir müdür yardımcısı hazırlarken, kendi planlarını da aynı dosyada tutmak istediklerinde, "hangi sekmenin güncel olduğu" ya da "kim en son ne değiştirdi" konusunda karışıklık yaşanabiliyor — özellikle birden fazla müdür yardımcısının kendi planı üzerinde ayrı ayrı değişiklik yapma ihtiyacı olduğunda.</p>

<h2 id="sik-hatalar">En Sık Yapılan Hatalar</h2>
<ul>
  <li><strong>Aynı kişiye sürekli pazartesi görevi:</strong> Dönüşüm sırası elle takip edildiğinde, tatil haftaları ya da devamsızlıklar nedeniyle sıra kayabilir ve bir kişi fark edilmeden hep aynı güne "kilitlenebilir".</li>
  <li><strong>Dengesiz görev dağılımı:</strong> Özellikle "özel okul ihtiyacına göre" esnek planlamada, bazı günlerin sürekli aynı kişiye verilmesi, toplam yükün adaletsiz dağılmasına yol açabilir.</li>
  <li><strong>Tatiller sonrası dengesizlik:</strong> Bir tatil haftası, dönüşüm sırasını nasıl etkilediği net tanımlanmadığında (o hafta sayılıyor mu, atlanıyor mu), tatil sonrası planı yeniden kurmak gerekebilir.</li>
  <li><strong>Son dakika değişiklikleri:</strong> Bir müdür yardımcısı aniden izin aldığında, yerine kimin geçeceği anlık karar verilir; bu kararın dönüşüm sırasına nasıl yansıtılacağı (sıradaki kişiden mi devam edilecek, o gün için tek seferlik mi değiştirilecek) net değilse, sonraki günlerin planı da karışabilir.</li>
  <li><strong>Toplam görev sayısını hiç kaydetmemek:</strong> Küçük kadrolarda "zaten herkese eşit geliyor" varsayımıyla hiçbir sayım tutulmaması, aylar sonra fark edilen büyük bir dengesizliğe yol açabilir.</li>
  <li><strong>Yeni gelen müdür yardımcısını dönüşüme geç dahil etmek:</strong> Dönem ortasında göreve başlayan bir müdür yardımcısının dönüşüme ne zaman ve nasıl dahil edileceği net değilse, bir süre mevcut müdür yardımcıları üzerindeki yük artmaya devam eder.</li>
</ul>
<p>Bu hataların büyük kısmı, tıpkı öğretmen nöbetinde olduğu gibi, kötü niyetten değil, elle takip edilen bir sistemin zamanla yorulmasından kaynaklanıyor. Kadro küçük olduğu için "nasılsa hatırlarız" varsayımıyla hareket etmek, kadro üç-dört kişiyi geçtiğinde ya da dönem birkaç ay sürdüğünde artık güvenilir olmaktan çıkıyor.</p>

<table>
  <thead><tr><th>Hata</th><th>Neden Oluyor</th><th>Nasıl Önlenir</th></tr></thead>
  <tbody>
    <tr><td>Aynı kişiye sürekli pazartesi görevi</td><td>Dönüşüm sırası elle takip edilirken tatil/devamsızlık sonrası kayması</td><td>Sırayı kayıt altına alan, tatilleri otomatik atlayan bir sistem kullanmak</td></tr>
    <tr><td>Dengesiz görev dağılımı</td><td>Toplam görev sayısının hiç kaydedilmemesi</td><td>Her müdür yardımcısının toplam görev sayısını düzenli izlemek</td></tr>
    <tr><td>Tatiller sonrası dengesizlik</td><td>Tatil haftasının sayılıp sayılmayacağının netleşmemesi</td><td>Kuralı baştan yazılı olarak belirlemek</td></tr>
    <tr><td>Son dakika değişiklikleri</td><td>Değişikliğin geri kalan sıraya nasıl yansıyacağının belirsizliği</td><td>Değişikliği kilitleyip geri kalanı otomatik yeniden düzenlemek</td></tr>
  </tbody>
</table>

<div class="alert alert-info" style="margin: 20px 0;"><strong>İpucu:</strong> Tatil haftalarının dönüşüm sırasını nasıl etkileyeceğine dair kuralı (o haftanın sayılıp sayılmayacağı) baştan yazılı olarak netleştirin. Bu tek karar, dönem içinde "sıra kimdeydi" tartışmalarının büyük kısmını önler.</div>
<p>Bu dört hatanın ortak paydası şu: hiçbiri tek bir büyük yanlış karardan değil, küçük ve o an için makul görünen kararların zaman içinde birikmesinden kaynaklanıyor. Bu da onları önceden fark etmeyi zorlaştırıyor — bir idareci "bugün bu şekilde çözelim" derken, bu kararın üç ay sonra nasıl bir dengesizliğe dönüşeceğini genellikle göremiyor.</p>

<h2 id="gercek-senaryolar">Gerçek Okul Senaryoları</h2>
<p>Aşağıdaki beş senaryo, farklı büyüklük ve yapıdaki okullarda müdür yardımcısı nöbet planlamasının nasıl farklılaştığını gösteriyor.</p>

<h3>2 Müdür Yardımcısı Olan Bir Okul</h3>
<p>Orta büyüklükte bir ortaokulda 2 müdür yardımcısı görev yapıyor. Her gün sırayla dönüşüm uygulanıyor — bir gün Ali, ertesi gün Ayşe. Bu düzenin avantajı basitliği: kimse "sıra kimde" diye düşünmek zorunda kalmıyor, gün aşırı düzen zaten öngörülebilir. Dezavantajı ise, iki kişiden biri izin aldığında diğerinin art arda birden fazla gün görev almak zorunda kalması.</p>
<p>Bu okulda yaşanan somut bir örnek: Ali bir hafta rapor aldığında, Ayşe o hafta boyunca her gün görevli oldu. Dönüşüm elle takip edildiğinden, Ali döndüğünde sıranın kaldığı yerden mi yoksa yeniden Ali'den mi başlayacağı konusunda kısa bir tartışma yaşandı — sonunda "Ali'nin izinli olduğu günler sayılmaz, sıra kaldığı yerden devam eder" kuralı yazılı hâle getirildi. Bu küçük ama önemli netleştirme, sonraki devamsızlıklarda aynı tartışmanın tekrarlanmasını önledi.</p>

<h3>3 Müdür Yardımcısı Olan Bir Okul</h3>
<p>Büyük bir lisede 3 müdür yardımcısı, haftalık dönüşümle çalışıyor. Bir hafta Ali, sonraki hafta Ayşe, sonraki hafta Mehmet. Bu düzen, haftalık süreklilik istenen (örneğin bir haftalık disiplin sürecinin takibi gibi) durumlar için uygun, ama üç haftada bir gelen sıra, bazı müdür yardımcılarının "neredeyse hiç görevli değilim" hissi yaşamasına da yol açabiliyor — bu da yönetimin diğer idari işleri de bu üç kişi arasında dengeli dağıtmasını gerektiriyor.</p>
<p>Bu okulda idare, yalnızca nöbet görevini değil, diğer idari sorumlulukları (evrak işleri, veli görüşmeleri gibi) da üç müdür yardımcısı arasında dengeli tutmaya çalıştığından, nöbet dönüşümünün "kim ne kadar yoruluyor" sorusunun yalnızca bir parçası olduğunu fark etmiş. Bu yüzden haftalık nöbet dönüşümünü, diğer görev dağılımlarından tamamen bağımsız değil, genel iş yükü dengesinin bir parçası olarak değerlendiriyorlar.</p>

<h3>Büyük Bir Lise</h3>
<p>80'den fazla öğretmeni, 1200'den fazla öğrencisi olan bir lisede, günlük olay/soru sayısı yüksek olduğundan ikişer günlük blok dönüşümü tercih edilmiş. Bu, hem günlük dönüşümün getirdiği sık el değiştirmeyi hem de haftalık dönüşümün getirdiği uzun süreli yükü dengelemeyi amaçlıyor — bir müdür yardımcısı bir konuyu iki gün boyunca takip edebiliyor, ama üç haftada bir gelen aşırı seyrek sıra da yaşanmıyor.</p>
<p>Bu büyüklükteki bir okulda idarenin karşılaştığı asıl zorluk, blok dönüşümünün tatil haftalarıyla kesiştiği noktalarda ortaya çıkmış: örneğin bir ara tatil, iki günlük bir bloğun tam ortasına denk geldiğinde, "bu blok tatil öncesi bir gün ve tatil sonrası bir günden mi oluşuyor, yoksa tatil sonrası yeni bir blok mu başlıyor" sorusu netleştirilmesi gereken bir detay olarak öne çıkmış. Okul, bu tür kesişmelerde "yalnızca aktif okul günleri sayılır" kuralını benimseyerek belirsizliği ortadan kaldırmış.</p>

<h3>Bir İlkokul</h3>
<p>Daha küçük bir ilkokulda tek müdür yardımcısı bulunduğunda, "dönüşüm" kavramı zaten anlamsızlaşıyor — o kişi her gün görevli. Bu senaryoda asıl planlama ihtiyacı, o kişi izinli/raporlu olduğunda okulun nasıl bir yedek düzeni işleteceği (örneğin okul müdürünün geçici olarak devralması) oluyor; bu, standart bir dönüşüm yöntemi değil, ayrı bir acil durum planı gerektiriyor.</p>
<p>Bu okulda yaşanan zorluk, tek kişilik bir "dönüşümün" olmaması nedeniyle kimsenin bu konuyu önceden düşünme ihtiyacı hissetmemesiydi — ta ki müdür yardımcısı beklenmedik bir sağlık sorunu nedeniyle iki hafta okuldan uzak kaldığında. O iki hafta boyunca nöbet raporlarını kimin inceleyeceği, gün içi sorunları kimin değerlendireceği net olmadığından, okul müdürü bu görevleri kendi üstlenmek zorunda kaldı — ama bu, önceden planlanmış bir düzenleme değil, anlık bir çözümdü.</p>

<h3>Aynı Kampüste İki Binası Olan Bir Okul</h3>
<p>Ana bina ve ek binadan oluşan bir okulda, iki müdür yardımcısı aynı gün farklı binalarda görevli olacak şekilde planlanmış — yani klasik "gün aşırı devral" mantığı değil, "aynı gün paralel görev" mantığı işletiliyor. Bu, standart üç yöntemden hiçbirine tam uymadığından, "özel okul ihtiyacına göre planlama" kategorisine giren bir örnek; her iki bina için ayrı ayrı görevli tanımlanıyor.</p>

<div class="mkt-card" style="margin: 20px 0; border-left: 3px solid var(--text-muted); padding-left: 16px;"><strong>Not:</strong> Bu beş senaryonun (2 müdür yardımcılı okul, 3 müdür yardımcılı büyük lise, çok kalabalık lise, tek müdür yardımcılı ilkokul, iki binalı okul) ortak noktası, "tek doğru yöntem" diye bir şeyin olmaması. Doğru yöntem, okulun büyüklüğüne, müdür yardımcısı sayısına ve okulun kendine özgü yapısına göre değişiyor — önemli olan seçilen yöntemin tutarlı ve yazılı biçimde uygulanması, ve gerektiğinde (öğretmen ya da müdür yardımcısı sayısı değiştiğinde) yeniden gözden geçirilmesi.</div>

<h2 id="modul">Görevli Müdür Yardımcısı Modülü Bu Süreci Nasıl Kolaylaştırıyor?</h2>
<p>OkulNöbet'in Görevli Müdür Yardımcısı modülü, yukarıda anlattığımız üç standart dönüşüm yöntemini (her gün sırayla, haftalık, belirli gün sayısına göre) doğrudan destekliyor. İşleyiş şöyle: önce müdür yardımcılarınızı sisteme tanımlıyorsunuz, ardından okulunuza uygun dönüşüm tipini seçiyorsunuz — günlük, haftalık ya da ikişer/üçer gün gibi belirlediğiniz bir blok süresi. Bu seçimi yaptıktan sonra program otomatik oluşuyor; tatil günleri rotasyon sırasını hiç etkilemiyor, çünkü sıra yalnızca gerçek okul günleri üzerinden ilerliyor.</p>
<h4>Örnek: İkişer Günlük Blok Nasıl İşliyor?</h4>
<p>Diyelim ki yukarıdaki büyük lise senaryosundaki gibi 3 müdür yardımcısı tanımladınız ve dönüşüm tipini "belirli gün sayısına göre dönüşüm" olarak 2 gün seçtiniz. Sistem, bir kişiyi art arda 2 aktif okul gününe kadar görevli tutuyor, ardından sıradaki kişiye geçiyor. Aradaki bir tatil günü otomatik atlanıyor — yani "bu blok tatil öncesinden mi sayılıyor" sorusunu elle çözmek zorunda kalmıyorsunuz, sistem kaldığı yerden devam ediyor.</p>
<p>Programı öğretmen nöbet çizelgesiyle birlikte tek bir Word belgesinde, aynı tabloda yazdırabiliyorsunuz; isterseniz müdür yardımcısı planını ayrı bir tablo olarak da çıktı alabiliyorsunuz. Bir müdür yardımcısı aniden izin aldığında, o güne özel bir kişi elle atayıp kilitleyebiliyorsunuz — sistem geri kalan günlerin dönüşümünü bu manuel değişikliğe göre otomatik olarak yeniden düzenliyor.</p>
<p>Bu düzenli ve adil dağılım, yazının başındaki "sıra kimdeydi" tartışmasının kaynağını ortadan kaldırıyor: sıra artık bir kişinin hafızasında değil, sistemde kayıtlı ve herkesin görebileceği bir yerde.</p>

<table>
  <thead><tr><th></th><th>Manuel (Kağıt/Hafıza)</th><th>Excel</th><th>OkulNöbet</th></tr></thead>
  <tbody>
    <tr><td>Sıra takibi</td><td>Hafızaya bağlı</td><td>Elle güncellenen formül</td><td>Sistem otomatik tutar</td></tr>
    <tr><td>Tatil günü etkisi</td><td>Elle hesaplanır, karışabilir</td><td>Formülde elle düzeltilmesi gerekir</td><td>Otomatik atlanır</td></tr>
    <tr><td>Devamsızlık sonrası toparlanma</td><td>Baştan tartışma konusu</td><td>Elle yeniden düzenleme</td><td>Kilitleme + otomatik yeniden düzenleme</td></tr>
    <tr><td>Öğretmen çizelgesiyle birleştirme</td><td>Ayrı belgeler</td><td>Kopyala-yapıştır</td><td>Aynı Word belgesinde ya da ayrı çıktı olarak</td></tr>
  </tbody>
</table>
<p>Yukarıdaki beş senaryoya dönecek olursak: 2 müdür yardımcılı okulun "Ali izinliyken sıra nasıl devam edecek" sorusu, sistemin devamsızlığı otomatik olarak hesaba katıp sıradaki kişiden devam etmesiyle çözülüyor; 3 müdür yardımcılı okulun haftalık dönüşümü ya da büyük lisenin ikişer günlük bloğu, dönüşüm tipi seçimiyle doğrudan karşılanıyor; iki binalı okulun paralel görev ihtiyacı ise her bina için ayrı bir tanım yaparak çözülebiliyor. Tek müdür yardımcılı ilkokul senaryosunda ise modülün asıl faydası, o kişi izinliyken boş kalan günü elle işaretleyip geçici bir görevli atayabilmek — sistemin "kimse tanımlı değilken" durumunu sessizce görmezden gelmek yerine açıkça göstermesi.</p>

<p>Öğretmen nöbet planlamasının genel adımlarını <a href="/blog/nobet-cizelgesi-hazirlamadan-once-bilinmesi-gerekenler">Nöbet Çizelgesi Hazırlamadan Önce Bilinmesi Gerekenler</a> yazımızda, adil dağılımın nasıl sağlanacağını <a href="/blog/adil-nobet-dagilimi-nasil-yapilir">Adil Nöbet Dağılımı Nasıl Yapılır?</a> yazımızda ele almıştık. Müdür yardımcılarının nöbetle ilgili resmî görev tanımını incelemek isterseniz <a href="/blog/ogretmen-nobet-yonetmeligi">Öğretmen Nöbet Yönetmeliği</a> yazımıza da göz atabilirsiniz.</p>

<div class="mkt-card" style="text-align: center; margin: 40px 0 8px; padding: 36px 28px;">
  <h2 style="margin: 0 0 12px;">Görevli Müdür Yardımcısı planınızı dakikalar içinde hazırlayın.</h2>
  <p style="color: var(--text-muted); margin: 0 0 24px; font-size: 15px; line-height: 1.7;">
    Müdür yardımcılarını tanımlayın. Dönüşüm yöntemini seçin. Programı otomatik oluşturun.
    Öğretmen nöbet çizelgesiyle birlikte Word olarak yazdırın.
  </p>
  <a href="/signup" class="mkt-btn mkt-btn-primary mkt-btn-lg">Ücretsiz Başla</a>
</div>$article$,
  'published',
  'Nöbet Yönetimi',
  array['müdür yardımcısı nöbet planı', 'görevli müdür yardımcısı', 'müdür yardımcısı nöbeti', 'nöbet planı hazırlama', 'görevli müdür yardımcısı çizelgesi', 'müdür yardımcısı görev çizelgesi', 'okul nöbet programı'],
  null,
  $meta$Müdür yardımcısı nöbet planı nasıl hazırlanır? Dönüşüm yöntemleri, sık yapılan hatalar ve gerçek okul örnekleriyle kapsamlı rehber.$meta$,
  $faqjson$[{"q":"Müdür yardımcısı nöbet planı ile öğretmen nöbet çizelgesi aynı şey mi?","a":"Hayır. Öğretmen nöbet çizelgesi, onlarca öğretmen arasında günlük bölge bazlı bir dağılımdır. Müdür yardımcısı nöbet planı ise genellikle 1-4 kişi arasında, daha uzun süreli (gün/hafta/blok) bir dönüşümle kurulan, öğretmen nöbetini denetleyen ayrı bir plandır."},{"q":"Görevli müdür yardımcısının görevi tam olarak nedir?","a":"O gün ya da o dönem, öğretmen nöbetinin sağlıklı işlemesinden idari olarak sorumlu olmaktır: nöbetçi öğretmenlerin yerinde olup olmadığını kontrol etmek, nöbet raporlarını incelemek ve gün içinde ortaya çıkan sorunları ilk elden değerlendirmek."},{"q":"Kaç müdür yardımcısı olan bir okulda dönüşüm planı gerekir?","a":"Birden fazla müdür yardımcısı olan her okulda bir dönüşüm düzeni faydalıdır. Tek müdür yardımcısı olan okullarda dönüşüm kavramı anlamsızlaşır; asıl ihtiyaç, o kişi izinli olduğunda devreye girecek bir yedek düzenidir."},{"q":"Hangi dönüşüm yöntemi en adil olanıdır?","a":"Tek bir yöntem her okul için en adil değildir. Küçük kadrolarda (2 kişi) günlük dönüşüm basitlik sağlar; büyük kadrolarda (3-4 kişi) haftalık ya da birkaç günlük blok dönüşümü, hem sürekliliği hem de dengeli yük dağılımını daha iyi sağlayabilir."},{"q":"Tatil haftaları dönüşüm sırasını nasıl etkilemeli?","a":"Bu konuda tek bir zorunlu kural yoktur; okulun kendi kararına bağlıdır. Önemli olan, tatil haftalarının dönüşüm sırasını atlayıp atlamayacağının baştan, yazılı biçimde netleştirilmesidir — aksi hâlde tatil sonrası \"sıra kimdeydi\" tartışması çıkar."},{"q":"Bir müdür yardımcısı izin aldığında plan nasıl toparlanır?","a":"En pratik yöntem, o güne özel bir kişiyi elle atayıp kilitlemek ve dönüşümün geri kalanının bu değişikliğe göre otomatik olarak yeniden düzenlenmesini sağlamaktır. Elle takip edilen planlarda bu, genellikle sonraki günlerin de tek tek elden geçirilmesini gerektirir."},{"q":"İkişer günlük dönüşüm nasıl işler?","a":"Bir müdür yardımcısı art arda iki aktif okul günü boyunca görevli kalır, ardından sıradaki kişiye geçilir. Blok süresi (iki gün, üç gün gibi) okulun ihtiyacına göre serbestçe belirlenebilir; tatil günleri bloğun sayımını etkilemez, yalnızca aktif günler sayılır."},{"q":"Haftalık dönüşümün avantajı nedir?","a":"Bir hafta boyunca aynı kişinin görevli kalması, o hafta içinde ortaya çıkan bir sorunun (örneğin bir disiplin sürecinin) baştan sona aynı kişi tarafından takip edilmesini kolaylaştırır. Dezavantajı, yoğun bir haftaya denk gelen kişinin o hafta daha fazla yük hissetmesi olabilir."},{"q":"Müdür yardımcısı sayısı azken (2 kişi) nelere dikkat edilmeli?","a":"Dönüşüm sıklığı otomatik olarak arttığından, tek bir devamsızlık planın büyük bir kısmını etkileyebilir. Bu durumda kimin kime nasıl vekalet edeceğine dair bir yedek düzenin baştan netleştirilmesi önemlidir."},{"q":"Excel ile müdür yardımcısı planı hazırlamak yeterli mi?","a":"Az sayıda kişi ve dikkatli takiple mümkün olabilir, ama dönüşüm mantığının (özellikle blok tabanlı dönüşümde) tatil günleri ve devamsızlıklarla birlikte tutarlı kalması Excel'de elle takip edilmesi zor bir iş. Öğretmen çizelgesiyle aynı belgede birleştirme de ayrı bir zorluk."},{"q":"Müdür yardımcısı planı öğretmen nöbet çizelgesiyle aynı belgede mi olmalı?","a":"Bu, okulun tercihine bağlı bir konu. Bazı okullar tek bir Word belgesinde aynı tabloda göstermeyi tercih ederken, bazıları ayrı bir tablo/çıktı olarak tutmayı tercih ediyor; her iki yaklaşım da yaygın."},{"q":"Dönüşüm sırası nasıl kayıt altına alınmalı?","a":"En azından kimin, hangi tarihte, hangi yöntemle görevlendirildiğinin yazılı bir kaydı tutulmalı. Bu kayıt olmadan, bir tatil ya da devamsızlık sonrası \"sıranın kaldığı yer\" konusunda görüş ayrılığı çıkması kolaylaşır."},{"q":"Büyük bir lisede hangi dönüşüm yöntemi daha uygundur?","a":"Öğrenci ve öğretmen sayısı fazla olduğunda günlük olay sayısı da arttığından, günlük dönüşümün getirdiği sık el değiştirme ile haftalık dönüşümün getirdiği uzun yük arasında denge kuran birkaç günlük blok dönüşümü sıklıkla tercih ediliyor."},{"q":"İki binası olan bir okulda müdür yardımcısı planı nasıl kurulur?","a":"Bu durumda çoğunlukla klasik \"sırayla devral\" mantığı yerine, aynı gün her bina için ayrı bir görevli tanımlanan \"paralel görev\" yaklaşımı kullanılır. Bu, standart üç yöntemden çok, okula özgü bir planlama gerektirir."},{"q":"Müdür yardımcısı nöbet planında son dakika değişiklikleri nasıl yönetilmeli?","a":"Değişikliğin yalnızca o günü değil, dönüşümün geri kalanını nasıl etkileyeceği baştan düşünülmeli. En sağlıklı yöntem, değişikliği elle işaretleyip kilitlemek ve geri kalan sırayı bu değişikliğe göre otomatik olarak yeniden düzenlemektir."},{"q":"Görevli müdür yardımcısı modülüne geçmek zaman alır mı?","a":"Temel adım, müdür yardımcılarını sisteme tanımlamak ve uygun dönüşüm tipini (günlük, haftalık, belirli gün sayısına göre) seçmektir. Bu tanımlama bir kez yapıldıktan sonra, program otomatik oluşuyor ve tatil günleri sırayı etkilemiyor."},{"q":"Müdür yardımcısı planı adaletsiz hissedilirse ne yapılmalı?","a":"Öncelikle hangi yöntemin (günlük, haftalık, blok) kullanıldığını ve bu yöntemin okulun büyüklüğüne uygun olup olmadığını gözden geçirmek gerekir. Genellikle adaletsizlik hissi, yöntemin kendisinden çok, tatil/devamsızlık sonrası sıranın tutarsız takip edilmesinden kaynaklanır."}]$faqjson$::jsonb,
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
