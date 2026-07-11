import { test, expect } from '@playwright/test';

test('giriş yapmamış kullanıcı köke gittiğinde /login sayfasına yönlenir', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Giriş Yap' })).toBeVisible();
});

test('giriş yapmamış kullanıcı /dashboard adresine doğrudan erişemez', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
