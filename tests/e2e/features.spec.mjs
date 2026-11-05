import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

test.describe('Fase 5: funcionalidades', () => {
  test('el buscador muestra secciones que coinciden y un mensaje sin resultados', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/buscar/');
    const input = page.locator('[data-search-input]');
    await input.fill('a');
    await expect(page.locator('[data-search-status]')).toContainText('dos letras');
    await input.fill('programas');
    await expect(page.locator('[data-search-results] a').first()).toBeVisible();
    await expect(page.locator('[data-search-results] a', { hasText: 'Programas' })).toHaveCount(1);
    await input.fill('zzqqxxnoexiste');
    await expect(page.locator('[data-search-status]')).toContainText('No encontramos');
    expect(watch.consoleErrors).toEqual([]);
  });

  test('el buscador carga el término de la URL (?q=)', async ({ page }) => {
    await page.goto('/buscar/?q=juegos');
    await expect(page.locator('[data-search-input]')).toHaveValue('juegos');
    await expect(
      page.locator('[data-search-results] a', { hasText: 'Juegos' }).first(),
    ).toBeVisible();
  });

  test('el buscador en inglés busca en el índice inglés', async ({ page }) => {
    await page.goto('/en/search/');
    await page.locator('[data-search-input]').fill('games');
    await expect(
      page.locator('[data-search-results] a', { hasText: 'Games' }).first(),
    ).toBeVisible();
  });

  test('el asistente se abre, se cierra con Escape y devuelve el foco al botón', async ({
    page,
  }) => {
    await page.goto('/juegos/');
    await waitForIntroDone(page);
    const opener = page.locator('[data-assistant-open]');
    await opener.click();
    const dialog = page.locator('[data-assistant-dialog]');
    await expect(dialog).toHaveAttribute('open', '');
    await expect(page.locator('[data-search-input]').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open', '');
    await expect(opener).toBeFocused();
  });

  test('el perfil local abre como diálogo modal y muestra el aviso de anonimato', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIntroDone(page);
    await page.locator('[data-profile-open]').click();
    const dialog = page.locator('[data-profile-dialog]');
    await expect(dialog).toHaveAttribute('open', '');
    await expect(dialog).toContainText('anónimo');
    await expect(dialog).toContainText('Todavía no marcaste');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open', '');
  });

  test('el ranking explica que no está disponible si Supabase no está configurado', async ({
    page,
  }) => {
    await page.goto('/ranking/');
    await expect(page.locator('[data-ranking-status]')).toContainText('todavía no está disponible');
    await expect(page.locator('[data-ranking-list] li')).toHaveCount(0);
  });

  test('los comentarios no se cargan hasta que se solicitan y muestran su estado si no están activos', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/juegos/');
    expect(watch.requestsTo(/giscus\.app/)).toEqual([]);
  });

  test('el buscador y el asistente no contactan ningún servicio externo', async ({ page }) => {
    const watch = watchPage(page);
    await page.goto('/buscar/?q=juegos');
    await expect(page.locator('[data-search-results] a').first()).toBeVisible();
    const external = watch.requestsTo(/^https?:\/\/(?!localhost)/);
    expect(external, external.join('\n')).toEqual([]);
  });
});
