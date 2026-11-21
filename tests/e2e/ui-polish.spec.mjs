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
    await expect(mask).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 2.5, -2.5)');
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
      const box = await page.locator('#tooltip-layer').boundingBox();
      expect(box, `tooltip ${index}`).not.toBeNull();
      expect(box?.x ?? 0).toBeGreaterThanOrEqual(11.5);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(360 - 11.5);
    }
  });

  test('cada sección tiene su propia atmósfera de fondo', async ({ page }) => {
    const tints = new Set();
    for (const path of ['/juegos/', '/programas/', '/freelance/', '/contacto/']) {
      await page.goto(path);
      tints.add(
        await page.evaluate(() =>
          getComputedStyle(document.body).getPropertyValue('--section-tint'),
        ),
      );
    }
    expect(tints.size).toBe(4);
    expect([...tints].every((tint) => tint.trim() !== '')).toBe(true);
  });
});
