import { expect } from '@playwright/test';

/**
 * Observa la página durante una prueba: errores de consola, infracciones de la CSP y peticiones
 * a terceros. Cualquiera de ellos hace fallar la prueba si no se espera explícitamente.
 */
export function watchPage(page) {
  const consoleErrors = [];
  const cspViolations = [];
  const requests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (/Content Security Policy|Refused to/i.test(message.text()))
      cspViolations.push(message.text());
  });
  page.on('request', (request) => requests.push(request.url()));

  return {
    consoleErrors,
    cspViolations,
    requestsTo(pattern) {
      return requests.filter((url) => pattern.test(url));
    },
  };
}

/** Comprueba que la página no tiene desplazamiento horizontal. */
export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.scroll, 'desplazamiento horizontal').toBeLessThanOrEqual(overflow.client + 1);
}

/** Espera a que el intro de bienvenida haya terminado (o no se haya mostrado). */
export async function waitForIntroDone(page) {
  await page.waitForFunction(
    () => !document.documentElement.classList.contains('intro-playing'),
    null,
    {
      timeout: 5000,
    },
  );
}
