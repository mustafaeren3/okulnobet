import { test, expect } from '@playwright/test';

test('giriş yapmamış kullanıcı /super-admin adresine doğrudan erişemez', async ({ page }) => {
  await page.goto('/super-admin');
  await expect(page).toHaveURL(/\/login$/);
});

test('giriş yapmamış kullanıcı /super-admin/mfa adresine doğrudan erişemez', async ({ page }) => {
  await page.goto('/super-admin/mfa');
  await expect(page).toHaveURL(/\/login$/);
});
