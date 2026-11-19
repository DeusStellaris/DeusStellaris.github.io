import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, watchPage } from './helpers.mjs';

const SLOW_3G = {
  offline: false,
  latency: 400,
  downloadThroughput: 50_000,
  uploadThroughput: 25_000,
};
const HUB_PATH = '/programas/deusdeck/hub/';

const resources = Array.from({ length: 30 }, (_, index) => ({
  id: `recurso-${index}`,
  category: 'themes',
  name:
    index === 7
      ? { es: 'Zafiro', en: 'Sapphire' }
      : { es: `Recurso ${index}`, en: `Resource ${index}` },
  description: { es: 'Descripción', en: 'Description' },
  author: 'Deus',
  version: '1.0.0',
  minAppVersion: '1.0',
  previewUrl: null,
  downloadUrl: 'https://example.com/r.zip',
  installable: false,
}));

/** Acumula el CLS de la página con PerformanceObserver (sin contar cambios por interacción). */
const trackLayoutShift = (page) =>
  page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });

test.describe('Móvil con red lenta (Slow 3G)', () => {
  test.skip(({ isMobile }) => !isMobile, 'solo móvil');

  test.beforeEach(async ({ page, context }) => {
    await page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));
    await trackLayoutShift(page);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', SLOW_3G);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  });

  test('la portada carga con contenido útil, sin saltos de diseño ni errores', async ({ page }) => {
    const watch = watchPage(page);
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('load', { timeout: 60_000 });
    await expectNoHorizontalScroll(page);
    expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1);
    expect(watch.consoleErrors).toEqual([]);
    expect(watch.cspViolations).toEqual([]);
  });

  test('el Hub muestra esqueletos, pagina y no desplaza el diseño al llegar los datos', async ({
    page,
  }) => {
    await page.route('**/hub-resources.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({ json: { resources } });
    });
    await page.goto(HUB_PATH, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const skeletons = page.locator('[data-hub-grid] .skeleton-card');
    await expect(skeletons).toHaveCount(6, { timeout: 30_000 });

    const cards = page.locator('[data-hub-grid] li:not(.skeleton-card)');
    await expect(cards).toHaveCount(12, { timeout: 30_000 });
    await expect(skeletons).toHaveCount(0);
    await expect(page.locator('[data-hub-status]')).toContainText('30 recursos');

    const more = page.locator('[data-hub-more]');
    await expect(more).toBeVisible();
    await more.click();
    await expect(cards).toHaveCount(24);
    await more.click();
    await expect(cards).toHaveCount(30);
    await expect(more).toBeHidden();

    await page.locator('[data-hub-search]').fill('zafiro');
    await expect(cards).toHaveCount(1);
    expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1);
  });

  test('navegar entre secciones sigue funcionando con red lenta', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.locator('a[href="/juegos/"]').first().click({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/juegos\/$/, { timeout: 45_000 });
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('Paneles en modo claro', () => {
  const frame = (page, selector) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          border: style.borderTopColor,
          shadow: style.boxShadow,
          background: style.backgroundColor,
        };
      });

  for (const lite of ['on', 'off']) {
    test(`las tarjetas se despegan del fondo con Modo Lite ${lite}`, async ({ page }) => {
      await page.addInitScript(
        ([liteValue]) => {
          localStorage.setItem('deus:theme', 'light');
          localStorage.setItem('deus:lite-mode', liteValue);
          sessionStorage.setItem('deus:intro-played', 'yes');
        },
        [lite],
      );
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      const card = await frame(page, '.section-card');
      // Marco dorado Kintsugi (#D4AF37) y sombra de elevación visibles; superficie distinta al fondo.
      expect(card.border).toMatch(/rgba?\(212, 175, 55/);
      expect(card.shadow).not.toBe('none');
      const pageBackground = await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      );
      expect(card.background).not.toBe(pageBackground);
    });
  }

  test('el foco por teclado sobre una tarjeta cambia el marco a violeta', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('deus:theme', 'light');
      sessionStorage.setItem('deus:intro-played', 'yes');
    });
    await page.goto('/');
    await page.locator('.section-card').first().focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const card = await frame(
      page,
      '.section-card:has(:focus-visible), .section-card:focus-visible',
    );
    expect(card.border).toMatch(/rgb\(124, 58, 237\)/);
  });
});
