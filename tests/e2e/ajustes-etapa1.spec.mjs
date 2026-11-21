import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

test.describe('Modo Lite por defecto y bienvenida', () => {
  test('sesión limpia: arranca en Modo Lite y la bienvenida igual se muestra y completa su recorrido', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/lite-mode/);
    await expect(page.locator('[data-intro-mark]')).toBeVisible();

    const start = await page.locator('[data-intro-mark]').boundingBox();
    await page.waitForTimeout(1700);
    const flying = await page.locator('[data-intro-mark]').boundingBox();
    expect(flying.width, 'el logotipo se achica durante el vuelo').toBeLessThan(start.width);
    expect(flying.x, 'el logotipo viaja hacia la izquierda').toBeLessThan(start.x);

    await waitForIntroDone(page);
    await expect(page.locator('[data-intro]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveClass(/lite-mode/);
    expect(await page.evaluate(() => sessionStorage.getItem('deus:intro-played'))).toBe('yes');
    expect(watch.consoleErrors).toEqual([]);
  });

  test('con el Modo Lite desactivado explícitamente se respeta al abrir el sitio', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('deus:lite-mode', 'off'));
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/lite-mode/);
  });
});

test.describe('Tema detectado por el navegador', () => {
  test.use({ colorScheme: 'light' });

  test('el modo claro se mantiene al navegar a Términos, Privacidad y Cookies', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('deus:theme'))).toBeNull();
    // El aviso de consentimiento tapa el pie en pantallas medianas: se cierra una vez por sesión.
    await page.locator('[data-consent-later]').click();

    for (const name of ['Términos', 'Privacidad', 'Cookies']) {
      await page.goto('/');
      await page.locator('footer').getByRole('link', { name }).first().click();
      await page.waitForURL(/terminos|privacidad|cookies/);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-label', /oscuro/i);
    }
  });

  test('el tema efectivo también sobrevive a la navegación entre secciones', async ({ page }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('.section-card', { hasText: 'Juegos' }).first().click();
    await page.waitForURL(/juegos/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('Aviso de consentimiento', () => {
  test('los enlaces legales son botones separados y cada uno navega por su cuenta', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    const group = page.locator('[data-consent-banner] .consent__links');
    const links = group.locator('a');
    await expect(links).toHaveCount(3);
    await expect(group).not.toContainText('·');

    const boxes = await links.evaluateAll((items) =>
      items.map((item) => {
        const { x, y, width, height } = item.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
    for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44);
    for (let i = 1; i < boxes.length; i++) {
      const sameRow = Math.abs(boxes[i].y - boxes[i - 1].y) < 2;
      if (sameRow) expect(boxes[i].x).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].width);
    }

    await links.nth(1).click();
    await expect(page).toHaveURL(/privacidad/);
  });

  test('"Rechazar opcionales" convive con "Guardar mis decisiones" y guarda el rechazo', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    const banner = page.locator('[data-consent-banner]');
    const reject = banner.getByRole('button', { name: 'Rechazar opcionales' });
    await expect(banner.getByRole('button', { name: 'Guardar mis decisiones' })).toBeVisible();
    await expect(reject).toHaveAttribute('data-tooltip', /opcionales/);
    await reject.click();
    await expect(page.locator('[data-consent-status]')).not.toHaveText('');
  });

  test('cada control del aviso tiene tooltip', async ({ page }) => {
    await page.goto('/en/');
    await waitForIntroDone(page);
    const controls = page.locator('[data-consent-banner] .consent__button');
    const count = await controls.count();
    expect(count).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < count; i++) {
      await expect(controls.nth(i)).toHaveAttribute('data-tooltip', /.+/);
    }
  });
});
