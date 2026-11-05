# Estado de implementación

Última actualización: Fase 2 (fundación) completada en el repositorio local. No hay commits.

## Verificado

| Comprobación                        | Resultado                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `npm install` (versiones exactas)   | OK, 0 vulnerabilidades (`npm audit`)                                         |
| `astro check` (TypeScript estricto) | 0 errores, 0 avisos                                                          |
| `biome check .` (lint y formato)    | Sin diagnósticos                                                             |
| `astro build` (12 páginas)          | OK, sin avisos                                                               |
| CSP en el HTML generado             | Presente, sin `unsafe-inline`, sin `unsafe-eval`; hashes generados por Astro |
| `hreflang`, canonical, `x-default`  | Presentes y emparejados ES/EN                                                |
| Scripts inline en páginas           | Ninguno (el tema es un script externo `/js/theme-init.js`)                   |
| Source maps (`.map`)                | Ninguno en `dist/`                                                           |
| 404 en español e inglés             | `noindex`, título en el idioma correcto                                      |

## No verificado (pendiente)

- **Pruebas en navegador** (responsive sin scroll horizontal, tema, fuentes, consola sin errores de CSP): **no ejecutadas**. El navegador de Playwright no está instalado y la descarga de Chromium falló en este entorno. Se harán en la Fase 7.
- Lighthouse, accesibilidad con axe, pruebas de red: Fase 7.

## Completado en la Fase 2

- Proyecto Astro 7.3.8 (última versión con al menos dos semanas de antigüedad), dependencias fijadas a versión exacta.
- TypeScript estricto con `noUnusedLocals`, `exactOptionalPropertyTypes` y `noUncheckedIndexedAccess`.
- Configuración centralizada del sitio en `src/config/site.json`. El dominio no está repetido en otros archivos.
- i18n nativo de Astro: ES en `/`, EN en `/en/`, con rutas localizadas (`/juegos/` y `/en/games/`).
- Diccionarios tipados en `src/i18n/`, con fallback al español en tiempo de ejecución.
- Tokens de diseño en `src/styles/tokens.css`. Tema oscuro por defecto; tema claro con `data-theme="light"`.
- Fuentes autoalojadas (Fontsource): Inter, Playfair Display, Silkscreen, VT323, JetBrains Mono.
- `BaseLayout` con metadatos SEO, hreflang, Open Graph, enlace de salto, `ClientRouter` (View Transitions) y script de tema sin parpadeo.
- Navegación con enlace al otro idioma (texto simple; el Sliding Pill Toggle llega en la Fase 3).
- Placeholders centralizados: contacto, publicidad (desactivada), Giscus (desactivado), URL de la API (null).
- Assets placeholder en `public/assets/` (SVG y WebP), identificados como placeholders.
- `.env.example` con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`, vacías.

## Desviaciones respecto a la aprobación

1. **Fallback de Astro desactivado.** Con `i18n.fallback` de Astro, la 404 en inglés salía en español y el build emitía un aviso. El fallback al español se aplica en los textos (`src/i18n/index.ts`). Los proyectos sin traducción se resolverán en la Fase 4.
2. **Resaltado de código desactivado** (`markdown.syntaxHighlight: false`). Shiki genera estilos inline incompatibles con la CSP. Reevaluar en la Fase 4.
3. **Reglas de lint para `.astro` desactivadas en Biome** (imports y variables sin uso), porque Biome no entiende el uso dentro de la plantilla. Lo cubre `astro check` con `noUnusedLocals`.
4. **Sin JavaScript, el sitio es siempre oscuro.** El tema claro depende del script de inicio.
5. **Plantillas legales y componente AdSense no se han creado todavía.** Están en la aprobación, pero su lugar natural es la Fase 6; las dejo para entonces y no las presento como hechas.

## Incompatibilidades técnicas que afectan a fases siguientes

- **GitHub Pages no ejecuta endpoints.** Los endpoints de likes y consentimientos (validación, rate limiting, `service_role`) deben vivir en un **Cloudflare Worker separado**, no en el sitio Astro. Su URL pública irá en `src/config/services.json`.
- **GitHub Pages no permite cabeceras HTTP.** La CSP se entrega por `<meta>`, sin `frame-ancestors`. Documentado en `docs/security/csp.md`.
- **Decap CMS:** `/admin` necesita una CSP propia, porque carga Decap desde CDN. Se resolverá en la Fase 4.

## Pendiente de fases siguientes

- **Fase 3:** selector de tema e idioma (Sliding Pill), Lite Mode, animación de bienvenida con el logotipo, buscador, favoritos, perfil local, asistente, protección de correo, tarjetas y secciones con identidad propia.
- **Fase 4:** Decap CMS (`public/admin/`), colecciones, páginas de proyecto, imágenes.
- **Fase 5:** migraciones SQL, RLS, likes y rankings, rate limiting, Giscus, Worker de la API.
- **Fase 6:** plantillas legales (GDPR, CCPA, Ley 25.326, términos, cookies) marcadas «PENDIENTE DE REVISIÓN LEGAL — BORRADOR NO DEFINITIVO», registro de consentimiento y componente AdSense.
- **Fase 7:** pruebas, incluidas las de navegador que no pude ejecutar aquí, Lighthouse y auditoría de seguridad.
- **Fase 8:** README completo y guía de despliegue.

## Nota sobre los textos

Los textos en inglés (`src/i18n/en.ts`) son una primera redacción mía y deben revisarse antes de publicar. Los textos en español usan voseo rioplatense («podés», «buscás»), coherente con tu perfil.
