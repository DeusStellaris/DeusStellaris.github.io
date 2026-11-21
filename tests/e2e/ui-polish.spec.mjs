import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

/** Pulido de interfaz: media luna, toasts, skeleton de likes y acordeón FAQ. */

test.describe('Pulido de interfaz', () => {
  test('el tema oscuro dibuja la media luna y el claro el sol completo', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('deus:theme', 'dark'));
    await page.goto('/');
    await waitForIntroDone(page);
    const mask = page.locator('.theme-toggle__mask');
    await expect(mask).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 5, -5)');
    await page.locator('[data-theme-toggle]').click();
    await expect(mask).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 24, -24)');
  });

  test('guardar una preferencia muestra un toast sobre el modal', async ({ page }) => {
    const watcher = watchPage(page);
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('[data-profile-open]:visible').first().click();
    await page.locator('[data-settings-toggle="lite"]').click();
    const toast = page.locator('.toast');
    await expect(toast).toHaveText('Preferencia guardada');
    await expect(page.locator('#toast-region')).toHaveAttribute('role', 'status');
    expect(await page.locator('#toast-region').evaluate((el) => el.matches(':popover-open'))).toBe(
      true,
    );
    await expect(toast).toHaveCount(0, { timeout: 6000 });
    expect(watcher.consoleErrors).toEqual([]);
  });

  test('el acordeón FAQ de Freelance abre con clic y navega con teclado', async ({ page }) => {
    await page.goto('/freelance/');
    await waitForIntroDone(page);
    const triggers = page.locator('.faq__trigger');
    await expect(triggers).toHaveCount(5);
    await expect(triggers.first()).toHaveAttribute('aria-expanded', 'false');
    await triggers.first().click();
    await expect(triggers.first()).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#faq-a1')).toBeVisible();
    await triggers.first().press('ArrowDown');
    await expect(triggers.nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await triggers.nth(1).press('Enter');
    await expect(page.locator('#faq-a2')).toBeHidden();
  });

  test('el acordeón FAQ existe en inglés', async ({ page }) => {
    await page.goto('/en/freelance/');
    await expect(page.locator('#faq-heading')).toHaveText('Frequently asked questions');
  });
});
