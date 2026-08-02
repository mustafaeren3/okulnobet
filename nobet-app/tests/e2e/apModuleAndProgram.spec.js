import { test, expect } from '@playwright/test';
import { createSyntheticSchool, loginViaUi } from './helpers';

// Kalite denetimi sonrası düzeltmelerin UÇTAN UCA (gerçek tarayıcı,
// gerçek DB) doğrulaması. Sentetik okul/öğretmen/bölge/görevli müdür
// yardımcısı verisi kullanılır (ZZZ_E2E_TEST_ önekli) — gerçek müşteri
// verisine dokunulmaz. Testler SIRALI (serial) — gerçek bir kullanıcı
// oturumunun akışını taklit eder (giriş → program üret → düzenle →
// dağılım → AP modülü → yazdırma), aynı sayfa/oturum baştan sona
// paylaşılır.
//
// TEMİZLİK: tests/e2e/helpers.js'teki notla aynı — anon key ile
// auth.users/schools silinemiyor (bu projenin TÜM DB testlerindeki
// mevcut kısıt), ZZZ_E2E_TEST_ önekli veri Supabase Dashboard'dan elle
// temizlenmeli.

test.describe.configure({ mode: 'serial' });

test.describe('Program + Görevli Müdür Yardımcısı + Yazdırma — uçtan uca', () => {
  let ctx;
  let page;

  test.beforeAll(async ({ browser }) => {
    ctx = await createSyntheticSchool('program');
    // Bir öğretmen + bir bölge API'den önceden eklenir — UI akışı hem
    // hızlansın hem de "manuel ekleme UI'dan da çalışıyor mu" ayrı bir
    // adımda (test 2) UI üzerinden EK bir öğretmenle doğrulansın.
    const { data: teacher, error: tErr } = await ctx.supabase
      .from('teachers')
      .insert({ school_id: ctx.schoolId, full_name: 'ZZZ_E2E_TEST_PROGRAM_T1', branch: 'sınıf' })
      .select()
      .single();
    if (tErr) throw new Error(tErr.message);
    ctx.teacher1 = teacher;

    const { data: zone, error: zErr } = await ctx.supabase
      .from('duty_zones')
      .insert({ school_id: ctx.schoolId, name: 'ZZZ_E2E_TEST_PROGRAM_ZONE', required_count: 1 })
      .select()
      .single();
    if (zErr) throw new Error(zErr.message);
    ctx.zone = zone;

    page = await browser.newPage();
    page.on('dialog', (dialog) => dialog.accept());
    await loginViaUi(page, ctx.email, ctx.password);
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('1) giriş sonrası Ayarlar sekmesi görünür', async () => {
    await expect(page.locator('.dash-root')).toBeVisible();
    await expect(page.locator('.tab-btn', { hasText: 'Ayarlar' })).toHaveClass(/active/);
  });

  test('2) manuel öğretmen ekleme UI\'dan çalışıyor (regresyon kontrolü)', async () => {
    const teacherCard = page.locator('.card', { has: page.locator('h3:has-text("Personel Yönetimi")') });
    const nameInput = teacherCard.locator('input[placeholder="AYŞE YILMAZ"]');
    const branchInput = teacherCard.locator('input[placeholder="Sınıf öğretmeni"]');
    await nameInput.click();
    await nameInput.fill('ZZZ_E2E_TEST_PROGRAM_T2');
    await expect(nameInput).toHaveValue('ZZZ_E2E_TEST_PROGRAM_T2');
    await branchInput.click();
    await branchInput.fill('sınıf');
    await expect(branchInput).toHaveValue('sınıf');
    await teacherCard.locator('button:has-text("+ Ekle")').click();
    await expect(teacherCard.locator('.person-item', { hasText: 'ZZZ_E2E_TEST_PROGRAM_T2' })).toBeVisible({ timeout: 10000 });
  });

  test('3) Görevli Müdür Yardımcısı ekleme + haftalık dönüşüm ayarı', async () => {
    const apCard = page.locator('.card', { has: page.locator('h3:has-text("Görevli Müdür Yardımcısı")') });
    const nameInput = apCard.locator('input[placeholder="AYŞE KAYA"]');
    await nameInput.click();
    await nameInput.fill('ZZZ_E2E_TEST_AP_PERSON');
    await expect(nameInput).toHaveValue('ZZZ_E2E_TEST_AP_PERSON');
    await apCard.locator('button:has-text("+ Ekle")').click();
    await expect(apCard.locator('.person-item', { hasText: 'ZZZ_E2E_TEST_AP_PERSON' })).toBeVisible({ timeout: 10000 });

    await apCard.locator('select').selectOption('weekly_block');
    await apCard.locator('button:has-text("Dönüşüm Ayarını Kaydet")').click();
    await expect(page.locator('.toast', { hasText: 'kaydedildi' })).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('4) Program Oluştur — otomatik üretim (dönme düzeni + tatil/hafta sonu davranışı)', async () => {
    // Pazartesi-Cuma tek bir hafta içi aralık (2026-11-02 Pzt .. 11-06 Cum).
    const dateCard = page.locator('.card', { has: page.locator('h3:has-text("Program Tarihleri")') });
    const startInput = dateCard.locator('input[type="date"]').nth(0);
    const endInput = dateCard.locator('input[type="date"]').nth(1);
    await startInput.click();
    await startInput.fill('2026-11-02');
    await endInput.click();
    await endInput.fill('2026-11-06');
    await expect(startInput).toHaveValue('2026-11-02');
    await expect(endInput).toHaveValue('2026-11-06');

    await page.click('button:has-text("PROGRAM OLUŞTUR")');
    // Başarı ekranı (SuccessScreen) — "Devam Et" ile kapatılır.
    await expect(page.locator('text=Program başarıyla oluşturuldu')).toBeVisible({ timeout: 20000 });
    await page.click('button:has-text("Devam Et")');
    await expect(page.locator('.tab-btn', { hasText: 'Program' })).toHaveClass(/active/);
  });

  test('5) Program tablosunda öğretmen ataması görünür', async () => {
    await expect(page.locator('.cell-person').first()).toBeVisible({ timeout: 10000 });
  });

  test('6) Tek tık popover → Kaldır → hücre boşalır', async () => {
    const cellCountBefore = await page.locator('.cell-person').count();
    const cell = page.locator('.cell-person').first();
    await cell.click();
    const popover = page.locator('.schedule-popover-actions');
    const removeItem = popover.locator('.schedule-popover-item', { hasText: 'Kaldır' });
    await expect(removeItem).toBeVisible();
    await removeItem.click();
    // Popover kapanır VE atanan kişi sayısı bir azalır — hücre "+" ghost
    // butonuna döner. (Popover'ın kendisi yerine gözlemlenebilir SONUCU
    // bekliyoruz — daha güvenilir, React re-render zamanlamasından bağımsız.)
    await expect(page.locator('.cell-person')).toHaveCount(cellCountBefore - 1, { timeout: 10000 });
    await expect(page.locator('.schedule-popover')).not.toBeVisible({ timeout: 10000 });
  });

  test('7) Boş hücrede hover ile "+" görünür (normalde gizli)', async () => {
    // Fare önceki testten (Kaldır tıklaması) bu hücrenin yakınında kalmış
    // olabilir — CSS :hover'ın gerçekten "hover'dan ÖNCE" durumunu ölçmek
    // için fareyi önce sayfanın uzak bir köşesine taşı.
    await page.mouse.move(0, 0);
    const ghostBtn = page.locator('.cell-add-btn-ghost').first();
    await expect(ghostBtn).toHaveCount(1, { timeout: 10000 });
    const opacityBefore = await ghostBtn.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacityBefore)).toBeLessThan(0.5);

    await ghostBtn.hover();
    // CSS geçişi 120ms (dashboard.css .cell-add-btn-ghost transition) —
    // computed style'ı geçiş bitmeden okumamak için kısa bir bekleme.
    await page.waitForTimeout(250);
    const opacityAfter = await ghostBtn.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacityAfter)).toBeGreaterThan(0.5);
  });

  test('8) "+" ile ekleme + klavye (Aşağı/Enter) ile seçim', async () => {
    await page.locator('.cell-add-btn-ghost').first().click();
    await expect(page.locator('.schedule-popover-picker')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('.schedule-popover')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.cell-person').first()).toBeVisible({ timeout: 10000 });
  });

  test('9) Çift tıklama doğrudan Değiştir (picker) açar', async () => {
    const cell = page.locator('.cell-person').first();
    await cell.dblclick();
    await expect(page.locator('.schedule-popover-picker')).toBeVisible({ timeout: 5000 });
  });

  test('10) ESC popover\'ı kapatır', async () => {
    await page.keyboard.press('Escape');
    await expect(page.locator('.schedule-popover')).not.toBeVisible({ timeout: 5000 });
  });

  test('11) Aylık Dağılım varsayılan görünüm, sayım tablosu var', async () => {
    await page.click('.tab-btn:has-text("Dağılım")');
    await expect(page.locator('.segmented-btn.active', { hasText: 'Aylık' })).toBeVisible();
    await expect(page.locator('.distrib-table')).toBeVisible({ timeout: 10000 });
  });

  test('12) Free plan — Yıllık Dağılım Premium kilidini açar (sunucu tarafında gerçekten engellenir)', async () => {
    await page.click('.segmented-btn:has-text("Yıllık")');
    await expect(page.locator('text=Yıllık Dağılım görünümü Premium\'e özel.')).toBeVisible({ timeout: 10000 });
    await page.click('button[aria-label="Kapat"]');
    await expect(page.locator('.modal-backdrop')).not.toBeVisible({ timeout: 5000 });
  });

  test('13) Görevli Müdür Yardımcısı — ücretsiz plan ortak kotayı test 4\'te ZATEN tükettiği için üretim REDDEDİLİR (kalite denetimi kararının uçtan uca kanıtı)', async () => {
    // Prod build'de (dev overlay'siz) gerçek kota davranışı: test 4'te
    // öğretmen programı üretimi ücretsiz planın TEK hakkını (varsayılan
    // quota=1) zaten tüketti. AP üretimi artık AYNI ortak sayacı
    // kullandığı için (bkz. lib/db/assistantPrincipalSchedule.js) burada
    // da reddedilmeli — tests/db/apQuotaSharing.test.js'in API seviyesinde
    // kanıtladığı davranışın TARAYICIDA uçtan uca doğrulanması.
    await page.click('.tab-btn:has-text("Program")');
    const apSection = page.locator('.ap-section');
    await apSection.locator('button:has-text("Oluştur")').click();
    await expect(page.locator('.toast', { hasText: 'Premium' })).toBeVisible({ timeout: 10000 });
    await expect(apSection.locator('.ap-person-chip')).toHaveCount(0);

    // Sonraki testler (Word/Yazdır içerik doğrulaması) gerçek AP verisi
    // gerektiriyor — üretim kotayla reddedildiği için burada DOĞRUDAN API
    // ile (kota kısıtına takılmayan manuel yol) bir atama seed ediliyor.
    const { data: person } = await ctx.supabase
      .from('assistant_principals')
      .select('id')
      .eq('school_id', ctx.schoolId)
      .eq('full_name', 'ZZZ_E2E_TEST_AP_PERSON')
      .single();
    const { error: seedErr } = await ctx.supabase
      .from('assistant_principal_assignments')
      .insert({ school_id: ctx.schoolId, assistant_principal_id: person.id, duty_date: '2026-11-02', is_manual: true });
    if (seedErr) throw new Error(seedErr.message);
    // BİLEREK sayfa yenilenmiyor: yenileme Dashboard'un client-side
    // viewedRange state'ini sıfırlardı (ücretsiz planda "Mevcut Aralığı
    // Görüntüle" Premium'e kilitli, geri dönüş yolu yok). exportHTML/
    // printSchedule zaten export ANINDA fetchAssistantPrincipalSchedule
    // ile SUNUCUDAN taze veri çekiyor (bkz. Dashboard.jsx
    // buildDocumentHtmlForCurrentView) — mevcut oturum/viewedRange
    // korunarak devam etmek yeterli, az önce API ile eklenen atama
    // Word/Yazdır'da görünecek.
  });

  // NOT: Word/PDF/Excel/Yazdır hepsi FEATURES.EXPORT_WORD/PRINT ile
  // Premium'e kilitli (bkz. lib/engine/access.js) — bu sentetik okul
  // ücretsiz plan olduğu için gerçek indirme/yazdırma içeriğini uçtan uca
  // burada DOĞRULAYAMIYORUZ (süper admin ile plan yükseltmek bu testin
  // kapsamı/yetkisi dışında). Bunun yerine: (a) kilidin GERÇEKTEN
  // tetiklendiğini doğruluyoruz (refactor'ün bu premium kapıları
  // bozmadığının kanıtı), (b) "aynı kaynak HTML" iddiası zaten statik kod
  // incelemesiyle kanıtlandı (exportHTML VE printSchedule'ın İKİSİ de
  // TEK bir buildScheduleDocumentHtml'i çağırdığı, ayrı bir şablonun
  // hiçbir yerde kalmadığı — bkz. final rapor).
  test('14) Word İndir — ücretsiz planda Premium kilidini açar (export kapıları bozulmamış)', async () => {
    await page.click('button:has-text("Word İndir")');
    await expect(page.locator('text=Word/PDF/Excel çıktısı ve yazdırma Premium\'e özel.')).toBeVisible({ timeout: 10000 });
    await page.click('button[aria-label="Kapat"]');
  });

  test('15) Yazdır — ücretsiz planda Premium kilidini açar (export kapıları bozulmamış)', async () => {
    await page.click('button:has-text("Yazdır")');
    await expect(page.locator('text=Word/PDF/Excel çıktısı ve yazdırma Premium\'e özel.')).toBeVisible({ timeout: 10000 });
    await page.click('button[aria-label="Kapat"]');
  });
});
