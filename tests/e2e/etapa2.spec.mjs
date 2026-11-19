import { expect, test } from '@playwright/test';
import { waitForIntroDone, watchPage } from './helpers.mjs';

const WINDOWS_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const MAC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const resource = (overrides = {}) => ({
  id: 'tema-violeta',
  category: 'themes',
  name: { es: 'Tema Violeta', en: 'Violet Theme' },
  description: { es: 'Un tema oscuro con acentos violeta', en: 'A dark theme with violet accents' },
  author: 'Deus',
  version: '1.0.0',
  minAppVersion: '1.0',
  previewUrl: null,
  downloadUrl: 'https://example.com/tema.zip',
  installable: true,
  ...overrides,
});

const mockCatalog = (page, resources) =>
  page.route('**/hub-resources.json', (route) => route.fulfill({ json: { resources } }));

test.describe('Animación FLIP de la bienvenida', () => {
  test('el logotipo central aterriza exactamente sobre el logotipo del header', async ({
    page,
  }) => {
    await page.goto('/?intro=true');
    await page.locator('[data-intro-mark]').waitFor();
    // Registra el último rectángulo del logotipo del overlay antes de que se retire.
    const landing = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let last = null;
          const tick = () => {
            const mark = document.querySelector('[data-intro-mark]');
            if (!mark) {
              const target = document.querySelector('[data-logo-mark]').getBoundingClientRect();
              resolve({ last, target: { x: target.x, y: target.y, width: target.width } });
              return;
            }
            const { x, y, width } = mark.getBoundingClientRect();
            last = { x, y, width };
            requestAnimationFrame(tick);
          };
          tick();
        }),
    );
    expect(Math.abs(landing.last.x - landing.target.x)).toBeLessThan(3);
    expect(Math.abs(landing.last.y - landing.target.y)).toBeLessThan(3);
    expect(Math.abs(landing.last.width - landing.target.width)).toBeLessThan(3);
  });

  test('el vuelo usa transform y opacity (translate3d + scale), sin filtros', async ({ page }) => {
    await page.goto('/?intro=true');
    await page.waitForTimeout(1700);
    const style = await page.evaluate(() => {
      const mark = document.querySelector('[data-intro-mark]');
      return mark && getComputedStyle(mark).transform;
    });
    expect(style).toMatch(/^matrix/);
    const filter = await page.evaluate(() => {
      const veil = document.querySelector('[data-intro-veil]');
      return veil && getComputedStyle(veil).backdropFilter;
    });
    expect(filter ?? 'none').toBe('none');
  });
});

test.describe('Ficha de DeusDeck', () => {
  test('presenta las seis funciones, el estado de prueba privada y los enlaces legales', async ({
    page,
  }) => {
    const watch = watchPage(page);
    await page.goto('/programas/deusdeck/');
    await waitForIntroDone(page);
    await expect(page.locator('h1')).toHaveText('DeusDeck');
    await expect(page.locator('.deck__badge')).toContainText('Prueba privada');
    await expect(page.locator('.deck__feature')).toHaveCount(6);
    for (const text of ['LAN', 'OBS', 'emojis', 'Soundboard', 'monitores', 'carpetas anidadas']) {
      await expect(page.locator('.deck__features')).toContainText(text);
    }

    const legal = page.locator('.deck__legal a');
    await expect(legal).toHaveCount(3);
    await expect(legal.nth(0)).toHaveAttribute('href', /\/programas\/deusdeck\/eula\/$/);
    await expect(legal.nth(1)).toHaveAttribute('href', /privacidad/);
    await expect(legal.nth(2)).toHaveAttribute('href', /terminos/);
    expect(watch.consoleErrors).toEqual([]);
    expect(watch.cspViolations).toEqual([]);
  });

  test('sin binarios públicos: los instaladores .msi y .exe quedan desactivados con tooltip', async ({
    browser,
  }) => {
    const context = await browser.newContext({ userAgent: WINDOWS_UA });
    const page = await context.newPage();
    await page.goto('/programas/deusdeck/');
    const buttons = page.locator('[data-deck-installers] button');
    await expect(buttons).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await expect(buttons.nth(i)).toBeDisabled();
      await expect(buttons.nth(i)).toHaveAttribute('data-tooltip', /instaladores públicos/);
    }
    await expect(page.locator('[data-deck-installers]')).toContainText('.msi');
    await expect(page.locator('[data-deck-installers]')).toContainText('.exe');
    await expect(page.locator('[data-deck-os]')).toHaveText('Windows');
    await expect(page.locator('[data-deck-unsupported]')).toBeHidden();
    await context.close();
  });

  test('en macOS detecta el sistema y avisa que los instaladores son solo para Windows', async ({
    browser,
  }) => {
    const context = await browser.newContext({ userAgent: MAC_UA });
    const page = await context.newPage();
    await page.goto('/programas/deusdeck/');
    await expect(page.locator('[data-deck-os]')).toHaveText('macOS');
    await expect(page.locator('[data-deck-unsupported]')).toBeVisible();
    await expect(page.locator('[data-deck-installers]')).toBeHidden();
    await context.close();
  });

  test('el selector de versión muestra las notas de lanzamiento y el estado privado', async ({
    page,
  }) => {
    await page.goto('/programas/deusdeck/');
    const select = page.locator('[data-deck-version]');
    await expect(select).toHaveAttribute('data-tooltip', /notas/);
    await expect(select.locator('option')).toHaveCount(1);
    await expect(
      page.locator('.deck__release:not([hidden]) .deck__notes li').first(),
    ).toContainText('Prueba cerrada');
    await expect(page.locator('.deck__release:not([hidden])')).toContainText('Sin fecha');
  });

  test('la versión en inglés está traducida y enlaza a su EULA y al Hub', async ({ page }) => {
    await page.goto('/en/programs/deusdeck/');
    await expect(page.locator('.deck__badge')).toContainText('Private beta');
    await expect(page.locator('.deck__features')).toContainText('Phone control over LAN');
    await expect(page.locator('.deck__hub a')).toHaveAttribute(
      'href',
      /\/en\/programs\/deusdeck\/hub\/$/,
    );
    await expect(page.locator('.deck__legal a').first()).toHaveAttribute(
      'href',
      /\/en\/programs\/deusdeck\/eula\/$/,
    );
  });

  test('el EULA incluye la cláusula AS-IS en español e inglés', async ({ page }) => {
    await page.goto('/programas/deusdeck/eula/');
    await expect(page.locator('article')).toContainText('«TAL CUAL»');
    await expect(page.locator('article')).toContainText('PENDIENTE');
    await page.goto('/en/programs/deusdeck/eula/');
    await expect(page.locator('article')).toContainText('"AS IS"');
  });

  test('Programas destaca DeusDeck y enlaza a su ficha', async ({ page }) => {
    await page.goto('/programas/');
    await page.locator('.featured').click();
    await expect(page).toHaveURL(/\/programas\/deusdeck\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});

test.describe('DeusDeck Hub', () => {
  // El aviso de consentimiento puede tapar las tarjetas en pantallas medianas: se descarta en la sesión.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('deus:consent-dismissed', 'yes'));
  });

  test('sin recursos muestra un estado vacío limpio y sin datos inventados', async ({ page }) => {
    await page.goto('/programas/deusdeck/hub/');
    await expect(page.locator('[data-hub-empty]')).toBeVisible();
    await expect(page.locator('[data-hub-empty]')).toContainText('Todavía no hay recursos');
    await expect(page.locator('[data-hub-grid] li')).toHaveCount(0);
    await expect(page.locator('[data-hub-toolbar]')).toBeHidden();
  });

  test('galería filtrable por categoría y buscador con debounce', async ({ page }) => {
    await mockCatalog(page, [
      resource(),
      resource({
        id: 'iconos-neon',
        category: 'icons',
        name: { es: 'Íconos neón', en: 'Neon icons' },
        description: { es: 'Set vectorial', en: 'Vector set' },
        author: 'Ana',
        installable: false,
      }),
      resource({
        id: 'plugin-clima',
        category: 'plugins',
        name: { es: 'Plugin del clima', en: 'Weather plugin' },
        description: { es: 'Muestra el clima', en: 'Shows the weather' },
        author: 'Luz',
      }),
    ]);
    await page.goto('/programas/deusdeck/hub/');
    const cards = page.locator('[data-hub-grid] li');
    await expect(cards).toHaveCount(3);
    await expect(page.locator('[data-hub-status]')).toContainText('3 recursos');

    for (const name of ['Temas', 'Íconos vectoriales', 'Emojis animados', 'Plugins', 'Todo']) {
      await expect(page.locator('.hub__chip', { hasText: name })).toBeVisible();
    }
    await expect(page.locator('.hub__chip').first()).toHaveAttribute('data-tooltip', /categoría/);

    await page.locator('.hub__chip', { hasText: 'Íconos vectoriales' }).click();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Íconos neón');
    await page.locator('.hub__chip', { hasText: 'Todo' }).click();
    await expect(cards).toHaveCount(3);

    await page.locator('[data-hub-search]').fill('clima');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Plugin del clima');
    await page.locator('[data-hub-search]').fill('zzzz');
    await expect(cards).toHaveCount(0);
    await expect(page.locator('[data-hub-status]')).toContainText('Ningún recurso');
  });

  test('la vista previa muestra compatibilidad y descarga directa o instalación desde la app', async ({
    page,
  }) => {
    await mockCatalog(page, [
      resource(),
      resource({
        id: 'solo-descarga',
        name: { es: 'Solo descarga', en: 'Download only' },
        installable: false,
      }),
    ]);
    await page.goto('/programas/deusdeck/hub/');
    await expect(page.locator('[data-hub-grid] .hub__compat').first()).toContainText(
      'DeusDeck 1.0 o superior',
    );

    await page.locator('[data-hub-open="tema-violeta"]').click();
    const dialog = page.locator('[data-hub-dialog]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Un tema oscuro con acentos violeta');
    await expect(dialog.locator('[data-f="install"]')).toHaveAttribute(
      'href',
      'deusdeck://install?id=tema-violeta',
    );
    await expect(dialog.locator('[data-f="download"]')).toHaveAttribute(
      'href',
      'https://example.com/tema.zip',
    );
    await dialog.locator('[data-hub-close]').click();

    await page.locator('[data-hub-open="solo-descarga"]').click();
    await expect(dialog.locator('[data-f="install"]')).toBeHidden();
    await expect(dialog.locator('[data-f="download"]')).toBeVisible();
  });

  test('un recurso malicioso se descarta o se pinta como texto, nunca como HTML', async ({
    page,
  }) => {
    await mockCatalog(page, [
      resource({ id: 'xss', name: { es: '<img src=x onerror="window.__xss=1">Tema', en: 'x' } }),
      resource({
        id: 'js-url',
        downloadUrl: 'javascript:alert(1)',
        previewUrl: 'data:text/html,x',
      }),
    ]);
    await page.goto('/programas/deusdeck/hub/');
    await expect(page.locator('[data-hub-grid] li')).toHaveCount(2);
    await expect(page.locator('[data-hub-grid]')).toContainText('<img src=x');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();

    await page.locator('[data-hub-open="js-url"]').click();
    await expect(page.locator('[data-hub-dialog] [data-f="download"]')).toBeHidden();
    await expect(page.locator('[data-hub-dialog] img')).toBeHidden();
  });

  test('si el catálogo no carga, muestra un error en vez de quedarse cargando', async ({
    page,
  }) => {
    await page.route('**/hub-resources.json', (route) => route.fulfill({ status: 500, body: 'x' }));
    await page.goto('/programas/deusdeck/hub/');
    await expect(page.locator('[data-hub-status]')).toContainText('No se pudo cargar');
  });

  test('versión en inglés con categorías traducidas', async ({ page }) => {
    await mockCatalog(page, [resource()]);
    await page.goto('/en/programs/deusdeck/hub/');
    await expect(page.locator('.hub__chip', { hasText: 'Vector icons' })).toBeVisible();
    await expect(page.locator('[data-hub-grid]')).toContainText('Violet Theme');
    await expect(page.locator('[data-hub-grid] .hub__compat')).toContainText(
      'DeusDeck 1.0 or later',
    );
  });
});

test.describe('Cuentas y demos, preparadas pero apagadas', () => {
  test('el panel de cuenta no se incluye mientras accountsEnabled sea false', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('[data-account]').count()).toBe(0);
  });

  test('sin demos publicadas no hay páginas de demo ni lista en Juegos', async ({
    page,
    request,
  }) => {
    await page.goto('/juegos/');
    await expect(page.locator('.demos')).toHaveCount(0);
    const index = await (await request.get('/demos-index.json')).json();
    expect(index).toEqual({ slugs: [] });
  });
});
