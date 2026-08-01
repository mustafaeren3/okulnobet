import { test, expect } from '@playwright/test';

// Kök ('/') artık BİLİNÇLİ olarak herkese açık marketing/landing sayfası
// (bkz. app/page.jsx, commit c07c36b: "marka kimliği, tasarım sistemi,
// landing page ve production hazırlığı") — giriş yapmamış ziyaretçi
// /login'e YÖNLENMEMELİ, landing page'i doğrudan görmeli. Bu test
// eskiden ('/' henüz landing page olmadan önce, korumalı bir rota iken)
// yazılmıştı ve o zamandan beri hiç güncellenmemişti.
test('giriş yapmamış kullanıcı köke gittiğinde herkese açık landing page\'i görür', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Giriş Yap' }).first()).toBeVisible();
});

test('giriş yapmamış kullanıcı /dashboard adresine doğrudan erişemez', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('giriş yapmamış kullanıcı /super-admin adresine doğrudan erişemez', async ({ page }) => {
  await page.goto('/super-admin');
  await expect(page).toHaveURL(/\/login$/);
});
