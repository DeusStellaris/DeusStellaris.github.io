import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

/**
 * Pruebas de contenido. Requieren los fixtures de tests/fixtures/content, que copia
 * scripts/e2e-content.mjs (npm run test:e2e:content). Sin fixtures, estas pruebas no aplican.
 */

test.describe('Fase 4 y 5: proyectos publicados', () => {
  test('la portada muestra los proyectos publicados y no el borrador', async ({ page }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    const titles = await page.locator('.project-card__title').allTextContents();
    expect(titles).toEqual(
      expect.arrayContaining(['Proyecto de prueba uno', 'Proyecto de prueba dos']),
    );
    expect(titles.join(' ')).not.toContain('Borrador de prueba');
  });

  test('las tarjetas muestran badges de etapa y de tecnología', async ({ page }) => {
    await page.goto('/');
    const uno = page.locator('.project-card', { hasText: 'Proyecto de prueba uno' });
    await expect(uno.locator('.badge--live')).toHaveText('En vivo');
    await expect(uno.locator('.badge--tech')).toHaveText('prueba');
    const dos = page.locator('.project-card', { hasText: 'Proyecto de prueba dos' });
    await expect(dos.locator('.badge--wip')).toHaveText('En desarrollo');
  });

  test('el feed de inicio ordena por fecha de publicación, de la más reciente a la más antigua', async ({
    page,
  }) => {
    await page.goto('/');
    const titles = await page.locator('.project-card__title').allTextContents();
    expect(titles.indexOf('Proyecto de prueba dos')).toBeLessThan(
      titles.indexOf('Proyecto de prueba uno'),
    );
  });

  test('una sección muestra solo sus proyectos', async ({ page }) => {
    await page.goto('/juegos/');
    await expect(
      page.locator('.project-card__title', { hasText: 'Proyecto de prueba uno' }),
    ).toBeVisible();
    await expect(
      page.locator('.project-card__title', { hasText: 'Proyecto de prueba dos' }),
    ).toHaveCount(0);
  });

  test('la página de detalle muestra categoría, fecha, colaborador y enlaces externos', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/proyectos/fixture-uno/');
    await expect(page.locator('h1')).toHaveText('Proyecto de prueba uno');
    await expect(page.locator('.project__meta')).toContainText('Categoría de prueba');
    await expect(page.locator('.collaborator__name')).toContainText('Colaborador de prueba');
    await expect(
      page.locator('.inline-links a', { hasText: 'Enlace de prueba' }).first(),
    ).toHaveAttribute('rel', 'noopener noreferrer');
    expect(watch.consoleErrors).toEqual([]);
  });

  test('un borrador no genera página', async ({ page }) => {
    const response = await page.goto('/proyectos/fixture-borrador/');
    expect(response?.status()).toBe(404);
  });

  test('el proyecto sin traducción muestra la versión en español con aviso en inglés', async ({
    page,
  }) => {
    await page.goto('/en/projects/fixture-dos/');
    await expect(page.locator('.project__fallback')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Proyecto de prueba dos');
  });

  test('un proyecto solo en inglés aparece en inglés y no en la versión española', async ({
    page,
  }) => {
    await page.goto('/en/freelance/');
    await expect(
      page.locator('.project-card__title', { hasText: 'English only test project' }),
    ).toBeVisible();
    // No existe página en español para un proyecto sin versión española publicada.
    const response = await page.goto('/proyectos/fixture-ingles/');
    expect(response?.status()).toBe(404);
  });

  test('las alternativas de idioma de un proyecto son correctas', async ({ page }) => {
    await page.goto('/proyectos/fixture-uno/');
    const alternates = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((links) =>
        links.map((link) => `${link.getAttribute('hreflang')} ${link.getAttribute('href')}`),
      );
    expect(
      alternates.some(
        (line) => line.startsWith('en ') && line.includes('/en/projects/fixture-uno/'),
      ),
    ).toBe(true);
  });
});

test.describe('Fase 5: favoritos y me gusta sobre proyectos', () => {
  test('marcar un favorito persiste tras recargar y aparece en el perfil', async ({ page }) => {
    await page.goto('/juegos/');
    await waitForIntroDone(page);
    const favorite = page.locator('.project-card [data-favorite-toggle][data-slug="fixture-uno"]');
    await expect(favorite).toHaveAttribute('aria-pressed', 'false');
    await favorite.click();
    await expect(favorite).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(
      page.locator('.project-card [data-favorite-toggle][data-slug="fixture-uno"]'),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-profile-open]').click();
    await expect(
      page.locator('[data-profile-dialog] a', { hasText: 'Proyecto de prueba uno' }),
    ).toBeVisible();
  });

  test('quitar un favorito desde el perfil lo elimina del almacenamiento', async ({ page }) => {
    await page.goto('/juegos/');
    await page.locator('.project-card [data-favorite-toggle][data-slug="fixture-uno"]').click();
    await page.locator('[data-profile-open]').click();
    await page.locator('[data-profile-remove="fixture-uno"]').click();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('deus:favorites') ?? '[]'),
    );
    expect(stored).not.toContain('fixture-uno');
  });

  test('un almacenamiento corrupto se descarta sin romper la página', async ({ page }) => {
    await page.goto('/juegos/');
    await page.evaluate(() => localStorage.setItem('deus:favorites', '{no es json'));
    await page.reload();
    await expect(page.locator('.project-card [data-favorite-toggle]').first()).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('el me gusta está habilitado con la API configurada', async ({ page }) => {
    await page.goto('/proyectos/fixture-uno/');
    const like = page.locator('[data-like-toggle][data-slug="fixture-uno"]');
    await expect(like).toBeEnabled();
  });

  test('los comentarios no cargan Giscus sin pulsar el botón y muestran su estado', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/proyectos/fixture-uno/');
    await expect(page.locator('.comments__disabled')).toContainText('todavía no están activos');
    expect(watch.requestsTo(/giscus\.app/)).toEqual([]);
  });
});
