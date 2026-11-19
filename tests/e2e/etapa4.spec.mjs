import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { watchPage } from './helpers.mjs';

const FOOTER_LINKS = {
  es: {
    start: '/',
    links: ['Términos', 'Privacidad', 'Cookies'],
    paths: ['/terminos/', '/privacidad/', '/cookies/'],
  },
  en: {
    start: '/en/',
    links: ['Terms', 'Privacy', 'Cookies'],
    paths: ['/en/terms/', '/en/privacy/', '/en/cookies/'],
  },
};

const prepare = (page, { theme, lite }) =>
  page.addInitScript(
    ([themeValue, liteValue]) => {
      localStorage.setItem('deus:theme', themeValue);
      localStorage.setItem('deus:lite-mode', liteValue);
      sessionStorage.setItem('deus:intro-played', 'yes');
      sessionStorage.setItem('deus:consent-dismissed', 'yes');
    },
    [theme, lite],
  );

test.describe('Etapa 4: documentos legales bilingües', () => {
  for (const [locale, { start, links, paths }] of Object.entries(FOOTER_LINKS)) {
    test(`el pie lleva a cada documento legal en ${locale}`, async ({ page }) => {
      await prepare(page, { theme: 'dark', lite: 'on' });
      const watch = watchPage(page);
      for (const [index, name] of links.entries()) {
        await page.goto(start);
        await page.locator('footer').getByRole('link', { name, exact: false }).first().click();
        await expect(page).toHaveURL(new RegExp(`${paths[index]}$`));
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('h1')).toBeVisible();
      }
      expect(watch.consoleErrors).toEqual([]);
      expect(watch.cspViolations).toEqual([]);
    });
  }

  test('la política de privacidad describe RUM, cuenta y sesión en ambos idiomas', async ({
    page,
  }) => {
    await prepare(page, { theme: 'dark', lite: 'on' });
    await page.goto('/privacidad/');
    await expect(page.locator('main')).toContainText('Web Vitals');
    await expect(page.locator('main')).toContainText('Argon2id');
    await expect(page.locator('main')).toContainText('Cloudflare Pages');
    await page.goto('/en/privacy/');
    await expect(page.locator('main')).toContainText('Do Not Track');
    await page.goto('/en/cookies/');
    await expect(page.locator('main')).toContainText('__Host-deus_session');
  });
});

test.describe('Etapa 4: contraste AA de las páginas legales', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'el contraste no depende del viewport; se audita en escritorio y tableta',
  );

  for (const theme of ['dark', 'light']) {
    for (const lite of ['on', 'off']) {
      test(`tema ${theme}, Modo Lite ${lite}`, async ({ page }) => {
        await prepare(page, { theme, lite });
        for (const path of ['/privacidad/', '/en/terms/', '/cookies/']) {
          await page.goto(path);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          const results = await new AxeBuilder({ page })
            .withRules(['color-contrast'])
            .include('main')
            .analyze();
          expect(results.violations, path).toEqual([]);
        }
      });
    }
  }
});
