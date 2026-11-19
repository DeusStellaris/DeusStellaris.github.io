import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

test.describe('Fase 3: sistema visual', () => {
  test('la bienvenida se reproduce una vez por sesión y termina sin bloquear', async ({ page }) => {
    const watch = watchPage(page);
    await page.goto('/');
    await waitForIntroDone(page);
    await expect(page.locator('[data-intro]')).toBeHidden();
    const played = await page.evaluate(() => sessionStorage.getItem('deus:intro-played'));
    expect(played).toBe('yes');

    // Segunda navegación de la sesión: no vuelve a mostrarse.
    await page
      .locator('nav a', { hasText: /Juegos|Games/ })
      .first()
      .click();
    await page.waitForURL(/juegos|games/);
    await expect(page.locator('[data-intro]')).toBeHidden();
    expect(watch.consoleErrors).toEqual([]);
  });

  test('con prefers-reduced-motion la bienvenida solo se desvanece, sin desplazar el logotipo', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('[data-intro-mark]')).toBeVisible();
    const before = await page.locator('[data-intro-mark]').boundingBox();
    await page.waitForTimeout(1400);
    const during = await page.locator('[data-intro-mark]').boundingBox();
    expect(during.x).toBeCloseTo(before.x, 0);
    expect(during.width).toBeCloseTo(before.width, 0);
    await waitForIntroDone(page);
    await context.close();
  });

  test('el selector de tema cambia el tema, lo recuerda y actualiza su etiqueta', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    const toggle = page.locator('[data-theme-toggle]');
    const before = await page.locator('html').getAttribute('data-theme');
    await toggle.click();
    const after = await page.locator('html').getAttribute('data-theme');
    expect(after).not.toBe(before);
    // La etiqueta accesible describe la acción disponible: con tema oscuro ofrece el claro, y viceversa.
    const expectedLabel = await toggle.getAttribute(
      after === 'dark' ? 'data-label-to-light' : 'data-label-to-dark',
    );
    await expect(toggle).toHaveAttribute('aria-label', expectedLabel);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', after);
  });

  test('el modo rendimiento arranca activo y desactivarlo se guarda', async ({ page }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    const lite = page.locator('[data-lite-toggle]');
    await expect(lite).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/lite-mode/);
    const transition = () =>
      page
        .locator('.site-nav__link')
        .first()
        .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(await transition()).toMatch(/^0s/);

    await lite.click();
    await expect(lite).toHaveAttribute('aria-pressed', 'false');
    expect(await transition()).not.toMatch(/^0s/);
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/lite-mode/);
  });

  test('el selector de idioma lleva a la página equivalente en inglés', async ({ page }) => {
    await page.goto('/juegos/');
    await page.locator('.lang-pill__option[hreflang="en"]').click();
    await expect(page).toHaveURL(/\/en\/games\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.lang-pill')).toHaveAttribute('data-locale', 'en');
  });

  test('el icono de sección aparece en la navegación de la sección activa', async ({ page }) => {
    await page.goto('/programas/');
    const marker = page.locator('.site-nav__marker');
    await expect(marker).toHaveCount(1);
    const name = await marker.evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(name).toBe('section-marker');
  });

  test('los elementos interactivos muestran un foco visible al navegar con teclado', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? getComputedStyle(el).outlineStyle : 'none';
    });
    expect(outline).not.toBe('none');
  });

  test('con prefers-reduced-motion las transiciones de los componentes duran prácticamente cero', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    const duration = await page
      .locator('.site-nav__link')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(Number.parseFloat(duration), `duración reducida: ${duration}`).toBeLessThanOrEqual(
      0.001,
    );
    await context.close();
  });
});
