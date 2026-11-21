import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

/** Marca (favicon e íconos), legibilidad del buscador de sección y PWA offline instalable. */

test.describe('Marca e íconos', () => {
  test('el favicon y los íconos PWA existen y son los de Deus', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('link[rel="icon"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    for (const href of hrefs) expect((await request.get(href)).ok(), href).toBe(true);
    const svg = await (await request.get('/favicon.svg')).text();
    expect(svg).toContain('data:image/png;base64');
    expect(svg).not.toContain('placeholder');

    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBe('#7C3AED');
    expect(manifest.background_color).toBe('#0B0914');
    const sizes = manifest.icons.map((icon) => `${icon.sizes}:${icon.purpose}`);
    expect(sizes).toEqual(
      expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']),
    );
    for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  });

  test('Freelance usa un maletín y no el lápiz', async ({ page }) => {
    await page.goto('/freelance/');
    const icon = page.locator('.site-nav [data-section-icon="freelance"]');
    await expect(icon.locator('rect')).toHaveCount(1);
    await expect(icon.locator('g')).toHaveAttribute('stroke-width', '1.5');
  });
});

test.describe('Legibilidad del buscador de sección', () => {
  for (const theme of ['light', 'dark']) {
    test(`el estado del buscador tiene superficie propia en Freelance (${theme})`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('deus:theme', value), theme);
      await page.goto('/freelance/');
      const style = await page
        .locator('.search-widget__status')
        .first()
        .evaluate((el) => {
          const css = getComputedStyle(el);
          return {
            background: css.backgroundColor,
            border: css.borderTopWidth,
            radius: css.borderTopLeftRadius,
          };
        });
      const alpha = Number(/rgba?\([^)]*?,\s*([\d.]+)\)$/.exec(style.background)?.[1] ?? 1);
      expect(alpha).toBeGreaterThanOrEqual(0.9);
      expect(style.border).toBe('1px');
    });
  }
});

test.describe('PWA', () => {
  test('el botón de instalar está oculto sin beforeinstallprompt', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));
    await page.goto('/');
    await waitForIntroDone(page);
    await expect(page.locator('[data-pwa-install]')).toBeHidden();
    await page.locator('[data-profile-open]:visible').first().click();
    await expect(page.locator('[data-pwa-install]')).toBeHidden();
  });

  test('el botón de instalar aparece con beforeinstallprompt y lo dispara', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));
    await page.goto('/');
    await waitForIntroDone(page);
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      window.__prompted = false;
      event.prompt = async () => {
        window.__prompted = true;
      };
      event.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });
    await page.locator('[data-profile-open]:visible').first().click();
    const install = page.locator('[data-pwa-install]');
    await expect(install).toBeVisible();
    await expect(install).toHaveAttribute('data-tooltip', /pantalla de inicio/);
    await install.click();
    await expect.poll(() => page.evaluate(() => window.__prompted)).toBe(true);
    await expect(page.locator('.toast')).toHaveText('App instalada');
  });

  test('sin conexión: páginas guardadas, y la página /offline/ para las que no se visitaron', async ({
    page,
    context,
  }) => {
    const watch = watchPage(page);
    await page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    // El shell (inicio, offline, índice de búsqueda y assets) se guarda al instalar.
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const names = await caches.keys();
            const cache = await caches.open(names.find((name) => name.startsWith('deus-')) ?? '');
            const keys = (await cache.keys()).map((request) => new URL(request.url).pathname);
            return {
              offline: keys.includes('/offline/') && keys.includes('/en/offline/'),
              index: keys.includes('/search-index.json'),
              assets: keys.some((path) => path.startsWith('/_astro/')),
              api: keys.some((path) => /^\/(auth|push|consent|accounts)/.test(path)),
            };
          }),
        { timeout: 20000 },
      )
      .toEqual({ offline: true, index: true, assets: true, api: false });

    await context.setOffline(true);
    await page.goto('/programas/never-visited-page/');
    await expect(page.locator('h1')).toHaveText('Sin conexión');
    await page.goto('/en/never-visited-page/');
    await expect(page.locator('h1')).toHaveText('Offline');
    await context.setOffline(false);
    expect(watch.consoleErrors.filter((text) => !/Failed to load|net::/.test(text))).toEqual([]);
  });
});
