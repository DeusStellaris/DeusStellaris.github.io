# Estado de implementación

Última actualización: Fase 4 (contenido y CMS) en curso. Fases anteriores: 294dac6 (Fase 2) y 67b5094 (Fase 3).

## Verificado

| Comprobación                        | Resultado                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `npm install` (versiones exactas)   | OK, 0 vulnerabilidades (`npm audit`)                                         |
| `astro check` (TypeScript estricto) | 0 errores, 0 avisos                                                          |
| `biome check .` (lint y formato)    | Sin diagnósticos                                                             |
| `astro build` (12 páginas)          | OK, sin avisos                                                               |
| CSP en el HTML generado             | Presente, sin `unsafe-inline`, sin `unsafe-eval`; hashes generados por Astro |
| `hreflang`, canonical, `x-default`  | Presentes y emparejados ES/EN                                                |
| Scripts inline sin hash             | Ninguno. El único script inline (bootstrap) tiene hash en la CSP, verificado |
| Source maps (`.map`)                | Ninguno en `dist/`                                                           |
| 404 en español e inglés             | `noindex`, título en el idioma correcto                                      |

## Fase 3: completado

- Logotipo con bienvenida (centro → header, un destello, una vez por sesión; omitida en Lite Mode y con reduced-motion).
- Selector de tema con morfado sol/luna, persistencia y seguimiento del sistema.
- Selector de idioma tipo Sliding Pill (sin JavaScript).
- Lite Mode: clase en <html> que desactiva animaciones, transiciones y transiciones de vista.
- Identidades de Inicio, Juegos (plano), Programas (terminal) y Freelance (editorial).
- Icono de sección que se desplaza en la navegación con View Transitions.
- Tarjetas de sección en Inicio.
- Inventario, estados e interacciones en `docs/architecture/phase-3-components.md`.

Verificado: `npm run ci` (0 errores, 0 avisos, 12 páginas); CSP sin estilos en atributos; hash del script inline en la CSP.

## Fase 4: completado

- **Colecciones tipadas** en `src/content.config.ts`: `projects` (por idioma), `collaborators` y `categories`. Ver `docs/architecture/content-model.md`.
- **Relaciones normalizadas**: un proyecto guarda solo los ids de sus colaboradores y su categoría (`reference()`). Un colaborador roto hace fallar el build.
- **Servicio de proyectos** (`src/services/projects.ts`): publicación (`status`), fallback de idioma, orden por fecha, feed de inicio (3 más recientes) y listados por sección.
- **Páginas de detalle** en ES (`/proyectos/<slug>/`) y EN (`/en/projects/<slug>/`), con colaboradores, galería, enlaces externos y aviso de fallback.
- **Portada y secciones** conectadas al contenido, con estados vacíos.
- **Decap CMS** en `/admin/`: configuración de colecciones y campos (`public/admin/config.yml`), bundle 3.17.1 servido desde el propio sitio, y CSP propia para esa página.
- **Seguridad del contenido**: sin HTML crudo en Markdown (plugin de Sätteri), solo enlaces `https://`, imágenes validadas por Astro.

Verificado: `npm run ci` con contenido vacío (0 errores, 0 avisos, 12 páginas). Con contenido de prueba (ya eliminado): borradores excluidos, fallback de idioma, feed ordenado, HTML crudo eliminado, colaboradores y categorías resueltos, hreflang correcto, AVIF y WebP, sin atributos `style=`, hash de todos los scripts inline en la CSP.

## Fase 4: pendiente y no verificado

- **Autenticación de Decap: NO configurada.** Falta el Worker OAuth (PKCE). `base_url` es un marcador explícito. Sin el Worker no se puede editar contenido.
- **Editor de Decap en navegador: no probado.** No he comprobado que la estructura `multiple_folders` de Decap 3.17.1 genere las rutas esperadas.
- **Riesgo de dependencias: pendiente de tu aceptación.** Decap 3.17.1 introduce 30 avisos de auditoría dentro de su bundle (ver `docs/security/dependencies.md`). Producción sigue en 0.
- **Contenido real**: no hay proyectos reales publicados. Los estados vacíos se muestran tal cual.

## Fase 5 (asignada por la aprobación)

Buscador, panel de perfil, asistente, favoritos, rankings y likes, Giscus, Worker de la API y RLS de Supabase.

## No verificado (pendiente)

- **Pruebas en navegador** (responsive sin scroll horizontal, bienvenida, morfado, Lite Mode, consola sin errores de CSP): **no ejecutadas**. El navegador de Playwright no está instalado y la descarga de Chromium falló. El navegador de Playwright no está instalado y la descarga de Chromium falló en este entorno. Se harán en la Fase 7.
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

- **Fase 3 (pendiente):** buscador, panel de perfil local y asistente de interfaz. No están en los pasos aprobados 1 a 10, así que no los doy por terminados. Protección de correo en contacto.
- **Fase 4:** Decap CMS (`public/admin/`), colecciones, páginas de proyecto, imágenes.
- **Fase 5:** migraciones SQL, RLS, likes y rankings, rate limiting, Giscus, Worker de la API.
- **Fase 6:** plantillas legales (GDPR, CCPA, Ley 25.326, términos, cookies) marcadas «PENDIENTE DE REVISIÓN LEGAL — BORRADOR NO DEFINITIVO», registro de consentimiento y componente AdSense.
- **Fase 7:** pruebas, incluidas las de navegador que no pude ejecutar aquí, Lighthouse y auditoría de seguridad.
- **Fase 8:** README completo y guía de despliegue.

## Nota sobre los textos

Los textos en inglés (`src/i18n/en.ts`) son una primera redacción mía y deben revisarse antes de publicar. Los textos en español usan voseo rioplatense («podés», «buscás»), coherente con tu perfil.
