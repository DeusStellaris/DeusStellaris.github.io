import { expect, test } from '@playwright/test';
import legal from '../../src/config/legal.json' with { type: 'json' };
import { waitForIntroDone, watchPage } from './helpers.mjs';

/** Pulido de interfaz: media luna, toasts, skeleton de likes y acordeón FAQ. */

test.describe('Pulido de interfaz', () => {
  test('el tema oscuro dibuja la media luna y el claro el sol completo', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('deus:theme', 'dark'));
    await page.goto('/');
    await waitForIntroDone(page);
    const mask = page.locator('.theme-toggle__mask');
    await expect(mask).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 1.68, -1.68)');
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

  test('Inicio tiene un solo acceso a Contacto, sin barra de secciones y con tres tarjetas', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await expect(page.locator('.site-nav')).toHaveCount(0);
    await expect(
      page.locator('header a[href="/contacto/"], main a[href="/contacto/"]'),
    ).toHaveCount(1);
    await expect(page.locator('.section-card')).toHaveCount(3);
  });

  test('las páginas internas muestran la barra con Contacto', async ({ page }) => {
    await page.goto('/juegos/');
    await expect(page.locator('.site-nav__link')).toHaveCount(4);
  });

  test('las tarjetas se expanden hacia los costados sin moverse en vertical', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'sin hover táctil');
    await page.addInitScript(() => localStorage.setItem('deus:lite-mode', 'off'));
    await page.goto('/');
    await waitForIntroDone(page);
    const card = page.locator('.section-card').first();
    const before = await card.boundingBox();
    await card.hover();
    await expect(card).toHaveCSS('transform', /matrix\(1\.05, 0, 0, 1, 0, 0\)/);
    const after = await card.boundingBox();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(1);
    expect(after?.width ?? 0).toBeGreaterThan(before?.width ?? 0);
  });

  test('el ojo de la contraseña tiene cursor pointer y alterna la visibilidad', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('[data-profile-open]:visible').first().click();
    const reveal = page.locator('[data-account-reveal]');
    await expect(reveal).toHaveCSS('cursor', 'pointer');
    const input = page.locator('#account-password');
    await reveal.click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(reveal).toHaveAttribute('aria-pressed', 'true');
  });

  test('Contacto muestra el correo y copiarlo dispara un toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/contacto/');
    await waitForIntroDone(page);
    await expect(page.locator('.contact__email')).toContainText('@');
    await page.locator('[data-copy-email]').click();
    await expect(page.locator('.toast')).toHaveText('Correo copiado');
  });

  test('lo aceptado en Inicio no reabre el aviso en las demás secciones, solo el botón del pie', async ({
    page,
  }) => {
    const record = {
      version: 1,
      legal: {
        terms: {
          version: legal.versions.terms,
          status: 'registered',
          acceptedAt: '2026-11-21T02:43:14.428631+00:00',
        },
        privacy: {
          version: legal.versions.privacy,
          status: 'registered',
          acceptedAt: '2026-11-21T02:43:14.428631+00:00',
        },
      },
      ads: null,
    };
    await page.addInitScript((value) => {
      localStorage.setItem('deus:consent', JSON.stringify(value));
      sessionStorage.setItem('deus:intro-played', 'yes');
    }, record);
    for (const path of ['/', '/juegos/', '/programas/', '/freelance/', '/contacto/']) {
      await page.goto(path);
      await expect(page.locator('[data-consent-banner]'), path).toBeHidden();
    }
    await page.locator('[data-consent-reopen]').first().click();
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
    await expect(page.locator('[data-consent-terms]')).toBeChecked();
    await expect(page.locator('[data-consent-privacy]')).toBeChecked();
  });

  test('los tooltips del modal de perfil quedan dentro del viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));
    await page.goto('/');
    await page.locator('[data-consent-later]').click();
    await page.locator('[data-profile-open]:visible').first().click();
    const controls = page.locator('[data-profile-dialog] [data-tooltip]');
    const count = await controls.count();
    expect(count).toBeGreaterThan(3);
    for (let index = 0; index < count; index++) {
      await controls.nth(index).scrollIntoViewIfNeeded();
      // El desplazamiento oculta el tooltip: se espera a que termine antes de enfocar.
      await page.waitForTimeout(150);
      await controls.nth(index).focus();
      // El tooltip por foco exige teclado real (:focus-visible): se sale y se vuelve a entrar con Tab.
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      const box = await page.locator('#tooltip-layer').boundingBox();
      expect(box, `tooltip ${index}`).not.toBeNull();
      expect(box?.x ?? 0).toBeGreaterThanOrEqual(11.5);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(360 - 11.5);
    }
  });

  test('cada sección tiene su fondo: blueprint en Juegos, puntos en Programas y mármol en el resto', async ({
    page,
  }) => {
    const image = async (path) => {
      await page.goto(path);
      return page.evaluate(() => getComputedStyle(document.body).backgroundImage);
    };
    const games = await image('/juegos/');
    const programs = await image('/programas/');
    expect(games).toContain('linear-gradient');
    expect(games).not.toContain('marble');
    expect(programs).toContain('radial-gradient');
    expect(programs).not.toContain('linear-gradient');
    expect(programs).not.toContain('marble');
    for (const path of ['/', '/freelance/', '/contacto/']) {
      expect(await image(path), path).toContain('marble');
    }
  });

  test('Contacto reparte las tarjetas en dos columnas a todo el ancho en escritorio', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'solo escritorio');
    await page.goto('/contacto/');
    const cards = page.locator('.contact__card');
    await expect(cards).toHaveCount(2);
    const [first, second] = await cards.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect()),
    );
    expect(Math.abs(first.top - second.top)).toBeLessThan(1);
    const container = await page
      .locator('.contact')
      .evaluate((node) => node.getBoundingClientRect());
    expect(second.right).toBeCloseTo(container.right, 0);
  });

  test('el modal de notificaciones no se mueve al recorrer las opciones', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));
    await page.goto('/');
    await page.locator('[data-consent-later]').click();
    await page.locator('[data-push-open]:visible').first().click();
    const options = page.locator('[data-push-dialog] label[data-push-option]:visible');
    const boxes = new Set();
    for (let round = 0; round < 2; round++) {
      for (let index = 0; index < (await options.count()); index++) {
        await options.nth(index).hover();
        const box = await page.locator('[data-push-dialog]').boundingBox();
        boxes.add(`${box?.y}/${box?.height}`);
      }
    }
    expect(boxes.size).toBe(1);
  });

  test('las opciones con panel lateral no muestran tooltip y el tooltip no captura el puntero', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'sin hover táctil');
    await page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));
    await page.goto('/');
    await page.locator('[data-consent-later]').click();
    await page.locator('[data-push-open]:visible').first().click();
    const options = page.locator('[data-push-dialog] label[data-push-option]');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let index = 0; index < count; index++) {
      await options.nth(index).hover();
      await expect(options.nth(index)).not.toHaveAttribute('data-tooltip', /.+/);
      await expect(page.locator('#tooltip-layer:popover-open')).toHaveCount(0);
    }
    await page.keyboard.press('Escape');
    await page.locator('[data-theme-toggle]').hover();
    await expect(page.locator('#tooltip-layer')).toHaveCSS('pointer-events', 'none');
  });

  test('al cerrar el modal de perfil no queda ningún tooltip abierto', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'sin hover táctil');
    await page.addInitScript(() => sessionStorage.setItem('deus:intro-played', 'yes'));
    await page.goto('/');
    await page.locator('[data-consent-later]').click();
    await page.locator('[data-profile-open]:visible').first().click();
    await page.locator('.profile__close').click();
    await page.mouse.move(5, 5);
    await expect(page.locator('[data-profile-dialog]')).not.toHaveAttribute('open', '');
    expect(await page.locator('#tooltip-layer').evaluate((el) => el.matches(':popover-open'))).toBe(
      false,
    );
  });

  test('la media luna está centrada y tiene el tamaño del sol', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('deus:theme', 'dark'));
    await page.goto('/');
    await expect(page.locator('.theme-toggle__core')).toHaveCSS(
      'transform',
      'matrix(2.17, 0, 0, 2.17, 0.5, -0.5)',
    );
    await expect(page.locator('.theme-toggle__mask')).toHaveCSS(
      'transform',
      'matrix(1, 0, 0, 1, 1.68, -1.68)',
    );
  });
});
