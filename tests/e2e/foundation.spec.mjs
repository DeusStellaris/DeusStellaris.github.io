import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, waitForIntroDone, watchPage } from './helpers.mjs';

/** Rutas públicas en ambos idiomas. */
const ROUTES = [
  { es: '/', en: '/en/' },
  { es: '/juegos/', en: '/en/games/' },
  { es: '/programas/', en: '/en/programs/' },
  { es: '/freelance/', en: '/en/freelance/' },
  { es: '/contacto/', en: '/en/contact/' },
  { es: '/buscar/', en: '/en/search/' },
  { es: '/ranking/', en: '/en/rankings/' },
  { es: '/terminos/', en: '/en/terms/' },
  { es: '/privacidad/', en: '/en/privacy/' },
  { es: '/cookies/', en: '/en/cookies/' },
  { es: '/programas/deusdeck/', en: '/en/programs/deusdeck/' },
  { es: '/programas/deusdeck/hub/', en: '/en/programs/deusdeck/hub/' },
  { es: '/programas/deusdeck/eula/', en: '/en/programs/deusdeck/eula/' },
];

for (const route of ROUTES) {
  for (const locale of ['es', 'en']) {
    const path = route[locale];
    test(`${path} carga sin errores de consola ni de CSP`, async ({ page }) => {
      const watch = watchPage(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await waitForIntroDone(page);
      expect(watch.consoleErrors, watch.consoleErrors.join('\n')).toEqual([]);
      expect(watch.cspViolations, watch.cspViolations.join('\n')).toEqual([]);
    });

    test(`${path} declara idioma, canonical, hreflang y título`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title).not.toMatch(/undefined|\{|\}/);
      const hreflangs = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('hreflang')));
      expect(hreflangs).toEqual(expect.arrayContaining(['es', 'en', 'x-default']));
    });

    test(`${path} no tiene desplazamiento horizontal en ningún tamaño`, async ({ page }) => {
      await page.goto(path);
      await waitForIntroDone(page);
      await expectNoHorizontalScroll(page);
    });
  }
}

test('la CSP no contiene unsafe-inline ni unsafe-eval en ninguna página probada', async ({
  page,
}) => {
  await page.goto('/');
  const csp = await page
    .locator('meta[http-equiv="content-security-policy"]')
    .getAttribute('content');
  expect(csp).toBeTruthy();
  expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
});

test('el tema se aplica antes del primer pintado (script bloqueante en head, sin async ni defer)', async ({
  page,
}) => {
  await page.goto('/');
  const script = await page.locator('head script[src*="preferences-init"]').evaluate((el) => ({
    async: el.async,
    defer: el.defer,
  }));
  expect(script).toEqual({ async: false, defer: false });
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
});

test('el enlace de salto aparece al enfocarlo con el teclado', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toHaveText(/contenido|content/i);
});
