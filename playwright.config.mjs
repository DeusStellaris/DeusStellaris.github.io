// Configuración de pruebas de navegador (Playwright).
//
// Navegador: Microsoft Edge instalado en el sistema (canal "msedge"). Así no hace falta descargar
// Chromium. En CI o en otra máquina sin Edge, usar PLAYWRIGHT_BROWSER=chromium tras
// `npx playwright install chromium` (ver docs/testing/browser.md).
//
// Servidor: se sirve el build de producción (`astro preview`), no el modo dev, para que las
// pruebas reflejen lo que se publicará.
import { defineConfig } from '@playwright/test';

const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;
const useEdge = process.env.PLAYWRIGHT_BROWSER !== 'chromium';

const browserChannel = useEdge ? { channel: 'msedge' } : {};

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/.results',
  fullyParallel: true,
  // Las pruebas de contenido necesitan fixtures copiados por scripts/e2e-content.mjs.
  testIgnore: process.env.E2E_CONTENT ? undefined : /content.spec.mjs/,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: './tests/e2e/.report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...browserChannel,
  },
  // Todos los proyectos usan el motor Chromium de Edge. Los descriptores de dispositivo de iPad y
  // Pixel se evitan porque apuntan a WebKit, que no está disponible con el canal msedge.
  projects: [
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        ...browserChannel,
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'tablet',
      use: {
        browserName: 'chromium',
        ...browserChannel,
        viewport: { width: 820, height: 1180 },
        deviceScaleFactor: 2,
        hasTouch: true,
      },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        ...browserChannel,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npx astro preview --port ${PORT} --host localhost`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
