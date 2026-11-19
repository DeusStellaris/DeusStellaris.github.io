import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

// Estas pruebas necesitan la demo de prueba y la API simulada de tests/fixtures/config:
// se ejecutan con `npm run test:e2e:content`, que compila el sitio con esos fixtures.

const API = 'https://api.test.example';
const DEMO_URL = '/juegos/demos/demo-test/';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Content-Type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

/** Simula la API de reseñas con estado propio. */
async function mockReviews(page, { reviews = [], postStatus = 200 } = {}) {
  const state = { reviews: [...reviews], posts: [] };
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (request.method() === 'POST') {
      state.posts.push(request.postDataJSON());
      return route.fulfill({ status: postStatus, headers: CORS, json: { saved: true } });
    }
    const count = state.reviews.length;
    const average =
      count === 0 ? null : state.reviews.reduce((sum, r) => sum + r.rating, 0) / count;
    return route.fulfill({
      headers: CORS,
      json: { slug: 'demo-test', count, average, reviews: state.reviews },
    });
  });
  return state;
}

test.describe('Demos jugables Click-to-Play', () => {
  test('Juegos lista la demo y enlaza a su página en ambos idiomas', async ({ page }) => {
    await mockReviews(page);
    await page.goto('/juegos/');
    await expect(page.locator('.demos__card')).toHaveCount(1);
    await expect(page.locator('.demos__card')).toContainText('Demo de prueba');
    await page.locator('.demos__card').click();
    await expect(page).toHaveURL(/\/juegos\/demos\/demo-test\/$/);

    await page.goto('/en/games/');
    await page.locator('.demos__card').click();
    await expect(page).toHaveURL(/\/en\/games\/demos\/demo-test\/$/);
    await expect(page.locator('h1')).toHaveText('Test demo');
  });

  test('antes de pulsar Jugar no hay iframe ni se pide el juego', async ({ page }) => {
    await mockReviews(page);
    const watch = watchPage(page);
    await page.goto(DEMO_URL);
    await waitForIntroDone(page);
    await expect(page.locator('.player__poster')).toBeVisible();
    await expect(page.locator('.player__facts')).toContainText('≈ 12 MB');
    await expect(page.locator('.player__facts')).toContainText('Teclado');
    await expect(page.locator('.player__facts')).toContainText('Táctil');
    await expect(page.locator('[data-player-play]')).toHaveAttribute(
      'data-tooltip',
      /marco aislado/,
    );
    expect(await page.locator('iframe').count()).toBe(0);
    expect(watch.requestsTo(/demos\/demo-test\/index\.html/)).toEqual([]);
  });

  test('al jugar carga el juego en un iframe aislado y la barra permite reiniciar y cerrar', async ({
    page,
  }) => {
    await mockReviews(page);
    const watch = watchPage(page);
    await page.goto(DEMO_URL);
    await waitForIntroDone(page);
    await page.locator('[data-player-play]').click();

    const frame = page.locator('.player__viewport iframe');
    await expect(frame).toHaveCount(1);
    const sandbox = await frame.getAttribute('sandbox');
    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).not.toContain('allow-same-origin');
    await expect(frame).toHaveAttribute('allow', /fullscreen/);
    await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    await expect(page.frameLocator('.player__viewport iframe').locator('#status')).toHaveText(
      'ready',
    );
    expect(watch.requestsTo(/demos\/demo-test\/index\.html/).length).toBe(1);
    expect(watch.cspViolations).toEqual([]);

    await page.locator('[data-player-restart]').click();
    await expect(page.frameLocator('.player__viewport iframe').locator('#status')).toHaveText(
      'ready',
    );
    expect(watch.requestsTo(/demos\/demo-test\/index\.html/).length).toBe(2);

    await page.locator('[data-player-close]').click();
    expect(await page.locator('iframe').count()).toBe(0);
    await expect(page.locator('.player__poster')).toBeVisible();
  });

  test('la pantalla completa alterna su etiqueta (modo de respaldo donde no existe la API)', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, 'fullscreenEnabled', { value: false });
    });
    await mockReviews(page);
    await page.goto(DEMO_URL);
    await waitForIntroDone(page);
    await page.locator('[data-player-play]').click();
    const button = page.locator('[data-player-fullscreen]');
    await button.click();
    await expect(page.locator('.player__stage')).toHaveClass(/is-pseudo-fullscreen/);
    await expect(button).toHaveText('Salir de pantalla completa');
    await button.click();
    await expect(page.locator('.player__stage')).not.toHaveClass(/is-pseudo-fullscreen/);
    await expect(button).toHaveText('Pantalla completa');
  });

  test('en pantallas táctiles los botones envían las teclas al juego', async ({ page }) => {
    await mockReviews(page);
    await page.goto(DEMO_URL);
    await waitForIntroDone(page);
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    test.skip(!coarse, 'solo en dispositivos con puntero táctil');

    await page.locator('[data-player-play]').click();
    await expect(page.locator('[data-player-touch]')).toBeVisible();
    const frame = page.frameLocator('.player__viewport iframe');
    await expect(frame.locator('#status')).toHaveText('ready');
    await page.locator('.player__pad[data-key="ArrowLeft"]').click();
    await expect(frame.locator('#last-key')).toHaveText('ArrowLeft:false');
  });

  test('versión en inglés con textos y tooltips traducidos', async ({ page }) => {
    await mockReviews(page);
    await page.goto('/en/games/demos/demo-test/');
    await expect(page.locator('[data-player-play]')).toHaveText('Play demo');
    await expect(page.locator('[data-player-play]')).toHaveAttribute(
      'data-tooltip',
      /isolated frame/,
    );
    await expect(page.locator('.player__facts')).toContainText('Estimated size');
  });
});

test.describe('Reseñas reales de la demo', () => {
  test('sin reseñas no se inventa ninguna: estado vacío honesto', async ({ page }) => {
    await mockReviews(page);
    await page.goto(DEMO_URL);
    await expect(page.locator('[data-reviews-summary]')).toContainText('Todavía no hay reseñas');
    await expect(page.locator('[data-reviews-list] li')).toHaveCount(0);
    await expect(page.locator('.reviews__real')).toContainText('Solo reseñas reales');
  });

  test('muestra puntuación y comentarios del servidor como texto plano (anti XSS)', async ({
    page,
  }) => {
    await mockReviews(page, {
      reviews: [
        {
          rating: 5,
          comment: '<img src=x onerror="window.__xss=1">Genial',
          locale: 'es',
          createdAt: '2026-11-19T10:00:00Z',
        },
        { rating: 3, comment: '', locale: 'es', createdAt: '2026-11-18T10:00:00Z' },
      ],
    });
    await page.goto(DEMO_URL);
    await expect(page.locator('[data-reviews-summary]')).toContainText('4.0 de 5 · 2 reseñas');
    await expect(page.locator('[data-reviews-list] li')).toHaveCount(2);
    await expect(page.locator('[data-reviews-list]')).toContainText('<img src=x');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(await page.locator('[data-reviews-list] img').count()).toBe(0);
  });

  test('exige puntuación, envía la reseña y vuelve a leer la lista', async ({ page }) => {
    const state = await mockReviews(page);
    await page.goto(DEMO_URL);
    const form = page.locator('[data-reviews-form]');

    await form.locator('button[type="submit"]').click();
    await expect(page.locator('[data-reviews-feedback]')).toContainText('puntuación');
    expect(state.posts).toEqual([]);

    await form.locator('.reviews__star').nth(3).click();
    await form.locator('textarea').fill('Muy buena demo');
    await expect(page.locator('[data-reviews-counter]')).toContainText('14 / 500');
    state.reviews.push({
      rating: 4,
      comment: 'Muy buena demo',
      locale: 'es',
      createdAt: '2026-11-19T12:00:00Z',
    });
    await form.locator('button[type="submit"]').click();

    await expect(page.locator('[data-reviews-feedback]')).toContainText('Gracias');
    expect(state.posts).toHaveLength(1);
    expect(state.posts[0]).toMatchObject({
      slug: 'demo-test',
      rating: 4,
      comment: 'Muy buena demo',
      locale: 'es',
    });
    expect(state.posts[0].visitorId).toMatch(/^[0-9a-f-]{36}$/);
    await expect(page.locator('[data-reviews-list] li')).toHaveCount(1);
  });

  test('si el servidor limita los envíos (429) o falla, informa sin romper', async ({ page }) => {
    await mockReviews(page, { postStatus: 429 });
    await page.goto(DEMO_URL);
    await page.locator('.reviews__star').nth(4).click();
    await page.locator('[data-reviews-form] button[type="submit"]').click();
    await expect(page.locator('[data-reviews-feedback]')).toContainText('Demasiados envíos');
    await expect(page.locator('[data-reviews-form] button[type="submit"]')).toBeEnabled();
  });

  test('controles con tooltip y estrellas accesibles', async ({ page }) => {
    await mockReviews(page);
    await page.goto('/en/games/demos/demo-test/');
    await expect(page.locator('.reviews__star').first()).toHaveAttribute(
      'data-tooltip',
      /Rate 1 out of 5/,
    );
    await expect(page.locator('.reviews__sr').nth(2)).toHaveText('3 out of 5');
    await expect(page.locator('[data-reviews-form] button[type="submit"]')).toHaveAttribute(
      'data-tooltip',
      /anonymously/,
    );
  });
});
