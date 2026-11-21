import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './helpers.mjs';

const ROUTES = [
  '/',
  '/juegos/',
  '/programas/',
  '/programas/deusdeck/',
  '/programas/deusdeck/hub/',
  '/freelance/',
  '/contacto/',
  '/terminos/',
  '/privacidad/',
  '/cookies/',
  '/en/',
  '/en/programs/deusdeck/hub/',
];

const prepare = (page, { theme = 'light', lite = 'on' } = {}) =>
  page.addInitScript(
    ([themeValue, liteValue]) => {
      localStorage.setItem('deus:theme', themeValue);
      localStorage.setItem('deus:lite-mode', liteValue);
      sessionStorage.setItem('deus:intro-played', 'yes');
      sessionStorage.setItem('deus:consent-dismissed', 'yes');
    },
    [theme, lite],
  );

test.describe('Animaciones y movimiento reducido del sistema', () => {
  const logoAnimation = (page) =>
    page.evaluate(() => {
      const mark = getComputedStyle(document.querySelector('.logo__mark'), '::after');
      return { name: mark.animationName, duration: mark.animationDuration };
    });

  test('con el SO pidiendo movimiento reducido y Modo rendimiento apagado, las animaciones corren', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await prepare(page, { lite: 'off' });
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/lite-mode/);
    expect(await logoAnimation(page)).toEqual({ name: 'brand-glint', duration: '7s' });
    const transition = await page
      .locator('.section-card')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(Number.parseFloat(transition)).toBeGreaterThan(0.01);
    await context.close();
  });

  test('con Modo rendimiento activo (por defecto) todo queda estático aunque el SO no pida reducción', async ({
    page,
  }) => {
    await prepare(page, { lite: 'on' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/lite-mode/);
    expect((await logoAnimation(page)).name).toBe('none');
  });

  test('con Modo rendimiento apagado el logotipo anima también sin preferencia del SO', async ({
    page,
  }) => {
    await prepare(page, { lite: 'off' });
    await page.goto('/');
    expect((await logoAnimation(page)).name).toBe('brand-glint');
  });
});

test.describe('Tooltips dentro del viewport', () => {
  test.skip(({ isMobile }) => !isMobile, 'solo móvil');

  for (const width of [360, 390, 430]) {
    test(`ningún tooltip del encabezado se corta a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await prepare(page);
      await page.goto('/programas/');
      const controls = page.locator('.site-header [data-tooltip]');
      const count = await controls.count();
      expect(count).toBeGreaterThan(3);
      for (let index = 0; index < count; index++) {
        const control = controls.nth(index);
        await control.focus();
        const box = await page.locator('#tooltip-layer').evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            viewport: document.documentElement.clientWidth,
          };
        });
        expect(box.left, `tooltip ${index} izquierda`).toBeGreaterThanOrEqual(11.5);
        expect(box.right, `tooltip ${index} derecha`).toBeLessThanOrEqual(box.viewport - 11.5);
      }
    });
  }
});

test.describe('Encabezado móvil', () => {
  test.skip(({ isMobile }) => !isMobile, 'solo móvil');

  for (const width of [360, 390, 430]) {
    test(`las cuatro secciones quedan en una sola fila alineada a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await prepare(page);
      await page.goto('/programas/');
      const boxes = await page.locator('.site-nav__link').evaluateAll((links) =>
        links.map((link) => {
          const rect = link.getBoundingClientRect();
          return { top: Math.round(rect.top), left: rect.left, right: rect.right };
        }),
      );
      expect(boxes).toHaveLength(4);
      expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
      for (const box of boxes) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
      }
      await expectNoHorizontalScroll(page);
    });
  }
});

test.describe('Capas de los modales', () => {
  for (const [name, trigger] of [
    ['Tu perfil local', '.profile-button'],
    ['notificaciones', '[data-push-open]'],
    ['búsqueda', '[data-assistant-open]'],
  ]) {
    test(`el modal de ${name} queda encima y bloquea el fondo`, async ({ page }) => {
      await prepare(page);
      await page.goto('/');
      await page.locator(trigger).first().click();
      const dialog = page.locator('dialog[open]:modal').first();
      await expect(dialog).toBeVisible();
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

      await page.keyboard.press('Escape');
      await expect(page.locator('dialog[open]')).toHaveCount(0);
    });
  }
});

test.describe('Barrido de páginas: sin desbordes ni errores', () => {
  for (const theme of ['light', 'dark']) {
    for (const lite of ['on', 'off']) {
      test(`tema ${theme}, Modo rendimiento ${lite}`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await prepare(page, { theme, lite });
        for (const route of ROUTES) {
          await page.goto(route);
          await expect(page.locator('h1').first()).toBeVisible();
          await expectNoHorizontalScroll(page);
        }
        expect(errors).toEqual([]);
      });
    }
  }
});
