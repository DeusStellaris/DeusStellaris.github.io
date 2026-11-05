# Entorno de pruebas de navegador

Cómo se ejecutan las pruebas de navegador (Playwright) y Lighthouse en este proyecto.

## Requisitos

- Node.js 20 o superior y `npm ci` ejecutado en la raíz.
- **Microsoft Edge instalado** (canal `msedge`). Playwright 1.64.1 lo usa directamente, por lo que no hace falta descargar Chromium. En entornos sin Edge, `PLAYWRIGHT_BROWSER=chromium` cambia el proyecto a Chromium de Playwright (requiere `npx playwright install chromium`).
- Lighthouse 13.5.0 usa Edge mediante la variable `CHROME_PATH`. Por defecto apunta a `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.

## Versiones usadas en la ejecución de Fase 7

| Herramienta                       | Versión                               |
| --------------------------------- | ------------------------------------- |
| Playwright (`@playwright/test`)   | 1.64.1                                |
| axe-core (`@axe-core/playwright`) | 4.14.0                                |
| Lighthouse                        | 13.5.0 (navegador Chrome/156 de Edge) |
| Astro                             | 7.3.8                                 |
| Biome                             | 2.6.5                                 |

## Comandos

| Comando                                  | Qué hace                                                                                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:e2e`                       | Suite Playwright completa (3 proyectos: escritorio, tableta, móvil). Levanta `astro preview` en el puerto 4321.                                                                           |
| `npm run test:e2e:content`               | Copia los fixtures de `tests/fixtures/content` a `src/content`, compila, ejecuta las pruebas de contenido y elimina las copias al terminar.                                               |
| `node scripts/lighthouse.mjs [ruta ...]` | Auditoría Lighthouse de escritorio y móvil sobre las páginas indicadas más las rutas extra. Requiere el servidor de vista previa en marcha. Escribe `docs/testing/lighthouse-results.md`. |
| `npm run ci`                             | Sincroniza Decap, Biome, `astro check`, build, pruebas unitarias, de Workers y de build.                                                                                                  |

Para medir una página de proyecto con Lighthouse hay que tener fixtures en `src/content` (los del repositorio no se publican). En Git Bash, anteponer `MSYS_NO_PATHCONV=1` para que las rutas `/proyectos/...` no se conviertan en rutas de Windows.

## Servidor de vista previa

Playwright y Lighthouse usan `astro preview` sobre `dist/`. Si el build falla con un error de bloqueo de archivo en Windows, hay que detener el proceso que escucha en el puerto 4321 antes de compilar.

## Resultados

Las cifras y el estado de cada suite están en `docs/STATUS.md` (sección Fase 7) y en `docs/testing/lighthouse-results.md`.

## Limitaciones

- Lighthouse móvil usa emulación (red y CPU limitadas), no un dispositivo real.
- INP no se mide: requiere interacción del usuario.
- Solo se prueba en Chromium/Edge. Firefox y Safari no están cubiertos.
- La medición de fuentes usa Segoe UI, Georgia y Consolas como respaldo (Windows). En macOS o Linux las métricas de respaldo son distintas y puede aparecer un pequeño desplazamiento al cargar las fuentes.
