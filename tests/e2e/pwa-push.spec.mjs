import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

test.describe('Bienvenida con ?intro=true', () => {
  test('el logotipo parte centrado y aterriza sobre el logotipo del encabezado', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/?intro=true');
    const mark = page.locator('[data-intro-mark]');
    await expect(mark).toBeVisible();

    const box = await mark.boundingBox();
    const viewport = page.viewportSize();
    expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - viewport.width / 2)).toBeLessThan(4);

    await waitForIntroDone(page);
    await expect(page.locator('[data-intro]')).toHaveCount(0);
    await expect(page.locator('[data-logo-mark]')).toHaveCSS('opacity', '1');
    expect(watch.consoleErrors).toEqual([]);
  });

  test('?intro=true se reproduce aunque la sesión ya la haya visto', async ({ page }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await page.goto('/?intro=true');
    await expect(page.locator('[data-intro-mark]')).toBeVisible();
  });
});

test.describe('Luces ambientales y Modo Lite', () => {
  test('el Modo Lite las apaga por defecto y al pulsarlo se encienden', async ({ page }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    const card = page.locator('.section-card').first();
    const animationOf = (pseudo) =>
      card.evaluate((el, p) => getComputedStyle(el, p).animationName, pseudo);

    expect(await animationOf('::before')).toBe('none');
    expect(await animationOf('::after')).toBe('none');

    await page.locator('[data-lite-toggle]').click();
    expect(await animationOf('::before')).toBe('border-trace');
    expect(await animationOf('::after')).toBe('nebula-breath');
  });

  test('el botón de Modo Lite tiene tooltip que explica el ahorro de recursos', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.locator('[data-lite-toggle]');
    await expect(toggle).toHaveAttribute('data-tooltip', /CPU.*GPU.*batería/);
    await toggle.hover();
    await expect(page.locator('#tooltip-layer')).toContainText(/CPU/);
  });
});

test.describe('PWA', () => {
  test('el manifiesto es instalable y los íconos existen', async ({ page, request }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifest = await (await request.get(href)).json();
    expect(manifest).toMatchObject({
      name: 'Deus',
      display: 'standalone',
      background_color: '#0B0914',
      theme_color: '#7C3AED',
    });
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  });

  test('el Service Worker se activa y sirve una página visitada sin conexión', async ({
    page,
    context,
  }) => {
    await page.goto('/juegos/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    await context.setOffline(true);
    await page.goto('/juegos/');
    await expect(page.locator('h1').first()).toBeVisible();

    await page.goto('/pagina-no-visitada/').catch(() => undefined);
    await expect(page.getByRole('heading', { name: 'Sin conexión' })).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe('Preferencias de notificaciones', () => {
  test('el panel ofrece Todo, Nada, categorías y proyectos (incluido deusdeck) con detalle de impacto', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('[data-push-open]').click();
    const dialog = page.locator('[data-push-dialog]');
    await expect(dialog).toBeVisible();

    await expect(dialog.locator('input[name="push-mode"]')).toHaveCount(4);
    // Las opciones con panel de detalle no llevan tooltip: su descripción ya está a la vista.
    await expect(dialog.locator('[data-push-option][data-tooltip]')).toHaveCount(0);
    await expect(dialog.locator('label[data-push-option]').first()).toBeVisible();

    await dialog.getByText('Por categoría').click();
    await expect(dialog.locator('input[name="push-category"]')).toHaveCount(3);
    // El detalle sigue al cursor: se vuelve a apuntar la opción tras desplegarse la lista.
    await dialog.locator('label[data-push-option]', { hasText: 'Por categoría' }).hover();
    await expect(dialog.locator('[data-out-battery]')).toContainText('Muy baja');

    await dialog.getByText('Por proyecto').click();
    await expect(dialog.locator('input[name="push-project"][value="deusdeck"]')).toBeAttached();

    const saved = await page.evaluate(() => localStorage.getItem('deus:push-preferences'));
    expect(JSON.parse(saved).mode).toBe('projects');
    expect(watch.consoleErrors).toEqual([]);
  });

  test('las preferencias elegidas se conservan al reabrir el panel', async ({ page }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('[data-push-open]').click();
    const dialog = page.locator('[data-push-dialog]');
    await dialog.getByText('Por categoría').click();
    await dialog.locator('input[name="push-category"][value="games"]').check();
    await dialog.locator('[data-push-close]').click();

    await page.locator('[data-push-open]').click();
    await expect(dialog.locator('input[name="push-mode"][value="categories"]')).toBeChecked();
    await expect(dialog.locator('input[name="push-category"][value="games"]')).toBeChecked();
  });

  test('en iPhone sin instalar muestra el aviso de instalación y bloquea la activación', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('[data-push-open]').click();
    const dialog = page.locator('[data-push-dialog]');
    await dialog.getByText('Todo', { exact: true }).click();
    await expect(dialog.locator('[data-push-ios]')).toBeVisible();
    await expect(dialog.locator('[data-push-ios]')).toContainText('Agregar a pantalla de inicio');
    await expect(dialog.locator('[data-push-enable]')).toBeDisabled();
    await context.close();
  });

  test('el aviso de iOS se muestra en inglés en la versión en inglés', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();
    await page.goto('/en/');
    await page.locator('[data-push-open]').click();
    const dialog = page.locator('[data-push-dialog]');
    await dialog.getByText('Everything').click();
    await expect(dialog.locator('[data-push-ios]')).toContainText('Add to Home Screen');
    await context.close();
  });
});
