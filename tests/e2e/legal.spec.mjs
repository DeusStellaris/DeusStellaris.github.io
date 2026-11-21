import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

const ES_NOTICE = 'PENDIENTE DE REVISIÓN LEGAL — BORRADOR NO DEFINITIVO';
const EN_NOTICE = 'PENDING LEGAL REVIEW — NON-FINAL DRAFT';

test.describe('Fase 6: legalidad, consentimiento y publicidad', () => {
  test('los documentos legales muestran el aviso permanente en español', async ({ page }) => {
    for (const path of ['/terminos/', '/privacidad/', '/cookies/']) {
      await page.goto(path);
      await expect(page.locator('.legal__notice')).toContainText(ES_NOTICE);
      await expect(page.locator('.legal__pending').first()).toBeVisible();
    }
  });

  test('los documentos en inglés muestran el aviso en inglés y la frase exacta en español', async ({
    page,
  }) => {
    for (const path of ['/en/terms/', '/en/privacy/', '/en/cookies/']) {
      await page.goto(path);
      await expect(page.locator('.legal__notice')).toContainText(EN_NOTICE);
      await expect(page.locator('.legal__notice')).toContainText(ES_NOTICE);
    }
  });

  test('el aviso de borrador no se oculta ni queda en el pie de página', async ({ page }) => {
    await page.goto('/privacidad/');
    const notice = page.locator('.legal__notice');
    await expect(notice).toBeVisible();
    const inFooter = await notice.evaluate((el) => Boolean(el.closest('footer')));
    expect(inFooter).toBe(false);
  });

  test('el aviso de consentimiento aparece con las casillas obligatorias desmarcadas', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    const banner = page.locator('[data-consent-banner]');
    await expect(banner).toBeVisible();
    await expect(page.locator('[data-consent-terms]')).not.toBeChecked();
    await expect(page.locator('[data-consent-privacy]')).not.toBeChecked();
    await expect(page.locator('[data-consent-ads]')).toHaveCount(0);
  });

  test('enviar sin marcar los documentos obligatorios muestra un error y no contacta el servidor', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('[data-consent-submit]').click();
    await expect(page.locator('[data-consent-error]')).toBeVisible();
    await expect(page.locator('[data-consent-error]')).toContainText('dos documentos');
    expect(watch.requestsTo(/\/consent/)).toEqual([]);
  });

  test('sin servidor configurado, marcar los documentos los deja como pendientes y no como registrados', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('[data-consent-terms]').check();
    await page.locator('[data-consent-privacy]').check();
    await page.locator('[data-consent-submit]').click();
    await expect(page.locator('[data-consent-status]')).toContainText('no la da por registrada');
    const record = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('deus:consent') ?? 'null'),
    );
    expect(record.legal.terms.status).toBe('pending');
    expect(record.legal.terms.acceptedAt).toBeNull();
    expect(record.legal.privacy.status).toBe('pending');
    // El aviso sigue visible: nada se presenta como aceptado.
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
  });

  test('«Más tarde» oculta el aviso durante la sesión sin registrar nada', async ({ page }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('[data-consent-later]').click();
    await expect(page.locator('[data-consent-banner]')).toBeHidden();
    await page.locator('.section-card').first().click();
    await expect(page.locator('[data-consent-banner]')).toBeHidden();
    const record = await page.evaluate(() => localStorage.getItem('deus:consent'));
    expect(record).toBeNull();
  });

  test('la página de cookies indica que no hay publicidad activa y permite reabrir el aviso', async ({
    page,
  }) => {
    await page.goto('/cookies/');
    await expect(page.locator('[data-consent-manager]')).toContainText('no hay publicidad activa');
    await expect(page.locator('[data-consent-manager-ads]')).toHaveCount(0);
    await page.locator('[data-consent-manager] [data-consent-reopen]').click();
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
  });
});

test.describe('Fase 6: AdSense desactivado por defecto', () => {
  test('ninguna página solicita recursos de Google con la publicidad apagada', async ({ page }) => {
    const watch = watchPage(page);
    for (const path of ['/', '/juegos/', '/cookies/']) {
      await page.goto(path);
      await waitForIdle(page);
    }
    expect(watch.requestsTo(/googlesyndication|doubleclick|googleads/)).toEqual([]);
  });

  test('no se renderiza ningún espacio publicitario', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ad-slot')).toHaveCount(0);
  });
});

async function waitForIdle(page) {
  await page.waitForLoadState('networkidle');
}
