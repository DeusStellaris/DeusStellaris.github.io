import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { waitForIntroDone } from './helpers.mjs';

/**
 * Auditoría de accesibilidad con axe-core (WCAG 2.0/2.1 A y AA) en las páginas principales.
 * Cualquier infracción detectada hace fallar la prueba y se corrige en el código.
 */

const PAGES = [
  '/',
  '/juegos/',
  '/programas/',
  '/freelance/',
  '/contacto/',
  '/buscar/',
  '/ranking/',
  '/terminos/',
  '/privacidad/',
  '/cookies/',
  '/en/',
  '/en/games/',
  '/en/search/',
];

for (const path of PAGES) {
  test(`axe (WCAG 2.1 AA) sin infracciones en ${path}`, async ({ page }) => {
    await page.goto(path);
    await waitForIntroDone(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} nodo(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
}

test('el documento tiene un único h1 y la jerarquía de títulos no salta niveles', async ({
  page,
}) => {
  await page.goto('/juegos/');
  await expect(page.locator('h1')).toHaveCount(1);
  const levels = await page
    .locator('h1, h2, h3, h4')
    .evaluateAll((els) => els.map((el) => Number(el.tagName[1])));
  for (let index = 1; index < levels.length; index += 1) {
    expect(
      levels[index] - levels[index - 1],
      `salto de nivel en la posición ${index}`,
    ).toBeLessThanOrEqual(1);
  }
});
