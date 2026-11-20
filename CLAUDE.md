# Portafolio Deus: guía para agentes

## Stack

- Astro 7.3.8 (sitio estático) + TypeScript 5.9.3 (strict).
- Biome 2.6.5 (lint/format), Playwright 1.64.1 (e2e), Lighthouse 13.5.0.
- Decap CMS (`decap-cms-app` 3.17.1) para contenido.
- Workers de Cloudflare: `workers/api` y `workers/decap-auth`.
- Supabase: `supabase/` (migraciones y tests).
- Node >= 22.23.4.

## Estructura

- `src/`: `components/`, `features/` (un módulo por funcionalidad), `i18n/` (`es`/`en`), `layouts/`, `pages/`, `content/`, `services/`, `lib/`, `config/`, `styles/`, `legal/`, `pwa/`, `server/`.
- `workers/api/`, `workers/decap-auth/`: cada uno con su `package.json`.
- `tests/`: `unit/`, `build/`, `e2e/`, `load/` (k6), `perf/`, `fixtures/`.
- `scripts/`: `sync-decap.mjs`, `lighthouse.mjs`, `e2e-content.mjs`.
- `docs/`: arquitectura, seguridad, legal, testing. Estado en `docs/STATUS.md`.
- `config/markdown/`: reglas de markdown.

## Scripts

- Test: `npm test` (unit + workers). Build tests: `npm run test:build`.
- Typecheck: no existe script `typecheck`; usar `npm run check` (`astro check`).
- Build: `npm run build` (ejecuta `sync:decap` antes).
- Lint: `npm run lint`. CI completo: `npm run ci`.

## Assets

- Originales pesados (PNG fuente, capturas) viven en `~/Documents/Deus_Workspace/_Deus_Assets/`, no en el repo.
- Usar solo derivados optimizados (WebP/AVIF o JPG comprimido) en `src/` y `public/`. No copiar originales al repo.
