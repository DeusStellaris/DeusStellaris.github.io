import { expect, test } from '@playwright/test';

test('la portada carga y muestra el título del sitio', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Deus/);
  await expect(page.locator('h1').first()).toBeVisible();
});
