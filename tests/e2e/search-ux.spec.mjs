import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, waitForIntroDone, watchPage } from './helpers.mjs';

/** Búsqueda por sección, búsqueda global, perfil en móvil y Contacto. */

const prepare = (page) =>
  page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));

test.describe('Búsqueda por sección', () => {
  for (const [path, query, expected] of [
    ['/programas/', 'deck', 'DeusDeck'],
    ['/en/programs/', 'deck', 'DeusDeck'],
  ]) {
    test(`${path} filtra en vivo solo proyectos de su categoría`, async ({ page }) => {
      const watch = watchPage(page);
      await prepare(page);
      await page.goto(path);
      const widget = page.locator('[data-search-widget][data-scope="programs"]');
      await expect(widget).toBeVisible();
      await widget.locator('[data-search-input]').fill(query);
      await expect(widget.locator('.search-result__title').first()).toHaveText(expected);
      await expect(widget.locator('.search-result__meta').first()).toContainText(
        /Proyecto|Project/,
      );
      expect(watch.consoleErrors).toEqual([]);
    });
  }

  test('Juegos y Freelance tienen su buscador con su propio placeholder y sin resultados ajenos', async ({
    page,
  }) => {
    await prepare(page);
    await page.goto('/juegos/');
    const games = page.locator('[data-search-widget][data-scope="games"] [data-search-input]');
    await expect(games).toHaveAttribute('placeholder', /Juegos/);
    await games.fill('deck');
    await expect(
      page.locator('[data-search-widget][data-scope="games"] .search-result'),
    ).toHaveCount(0);
    await page.goto('/freelance/');
    await expect(
      page.locator('[data-search-widget][data-scope="freelance"] [data-search-input]'),
    ).toHaveAttribute('placeholder', /Freelance/);
  });
});

test.describe('Búsqueda global', () => {
  test('el botón está en el encabezado, no hay botón flotante y abre con Ctrl+K y con /', async ({
    page,
  }) => {
    await prepare(page);
    await page.goto('/');
    await waitForIntroDone(page);
    await expect(page.locator('.site-header [data-assistant-open]')).toBeVisible();
    await expect(page.locator('.assistant__opener')).toHaveCount(0);
    const dialog = page.locator('[data-assistant-dialog]');
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.keyboard.press('/');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#assistant-dialog [data-search-input]')).toBeFocused();
    await page.keyboard.type('/');
    await expect(dialog).toBeVisible();
  });

  test('el modal no tiene scroll horizontal, limpia con × y acota la consulta a 100 caracteres', async ({
    page,
  }) => {
    await prepare(page);
    await page.goto('/');
    await page.locator('.site-header [data-assistant-open]').click();
    const input = page.locator('#assistant-dialog [data-search-input]');
    await input.fill('a'.repeat(300));
    expect((await input.inputValue()).length).toBeLessThanOrEqual(100);
    const clear = page.locator('#assistant-dialog [data-search-clear]');
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(input).toHaveValue('');
    await expect(clear).toBeHidden();
    const overflow = await page.locator('#assistant-dialog .assistant__inner').evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
    await input.fill('<img src=x onerror=alert(1)> (.*)+$');
    await expect(page.locator('#assistant-dialog img')).toHaveCount(0);
  });
});

test.describe('Móvil 360x800', () => {
  test.skip(({ isMobile }) => !isMobile, 'solo móvil');

  test('el modal de perfil scrollea de corrido y llega a los campos de cuenta', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await prepare(page);
    await page.goto('/');
    await page.locator('[data-consent-later]').click();
    await page.locator('[data-profile-open]:visible').first().click();
    expect(
      await page.locator('.profile__detail').evaluate((el) => getComputedStyle(el).position),
    ).toBe('static');
    const password = page.locator('#account-password');
    await password.scrollIntoViewIfNeeded();
    await expect(password).toBeVisible();
    const covered = await password.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return top === el;
    });
    expect(covered).toBe(true);
  });

  test('el correo de Contacto entra en una sola línea y el buscador global no desborda', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await prepare(page);
    await page.goto('/contacto/');
    const email = page.locator('.contact__email');
    const box = await email.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return {
        lines: new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size,
        overflow: el.scrollWidth > el.clientWidth,
      };
    });
    expect(box.lines).toBe(1);
    expect(box.overflow).toBe(false);
    await expectNoHorizontalScroll(page);
    await page.locator('.site-header [data-assistant-open]').click();
    await expectNoHorizontalScroll(page);
  });
});

test.describe('Contacto', () => {
  test('ofrece copiar, escribir y abrir en Gmail, en los dos idiomas', async ({ page }) => {
    for (const [path, label] of [
      ['/contacto/', 'Abrir en Gmail'],
      ['/en/contact/', 'Open in Gmail'],
    ]) {
      await page.goto(path);
      const gmail = page.getByRole('link', { name: label });
      await expect(gmail).toHaveAttribute(
        'href',
        /^https:\/\/mail\.google\.com\/mail\/\?view=cm&to=/,
      );
      await expect(gmail).toHaveAttribute('target', '_blank');
      await expect(gmail).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(gmail).toHaveAttribute('data-tooltip', /Gmail/);
      await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
    }
  });
});
