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

## Fase 5: buscador, perfil, favoritos, ranking, likes y comentarios

**Construido y verificado sin credenciales:**

- **Buscador** (`/buscar/`, `/en/search/`): índice estático generado en build (`/search-index.json`), búsqueda sin acentos y ponderada (título > categoría y etiquetas > resumen), filtro por sección y estados de carga, error con reintento, sin resultados y resultados. Núcleo puro probado con 9 pruebas.
- **Asistente flotante** (esquina inferior derecha): `<dialog>` no modal que reutiliza el buscador. Escape lo cierra, devuelve el foco al botón y prioriza los resultados de la sección actual.
- **Perfil local** (`<dialog>` modal): favoritos con enlaces y opción de quitarlos, resumen de preferencias y aviso explícito de que es anónimo y solo local.
- **Favoritos**: `localStorage` con validación al leer (un valor corrupto se descarta). Si el navegador no permite guardar, se mantienen en memoria y se avisa al visitante.
- **Ranking** (`/ranking/`, `/en/rankings/`): contadores por RPC de solo lectura y filtro por categoría. Sin configuración, muestra el estado "no disponible" en lugar de cifras inventadas.
- **Me gusta**: el navegador envía un UUID anónimo al Worker de la API. El Worker valida, limita la frecuencia y guarda solo un HMAC del visitante.
- **Giscus**: carga bajo demanda, tras pulsar el botón. Mientras `giscus.json` no tenga `repoId` y `categoryId`, muestra "comentarios no activos".
- **Worker de la API** (`workers/api`): 16 pruebas. Documentado en `workers/api/README.md`.
- **Migración SQL y pruebas RLS** (`supabase/`): verificadas contra PostgreSQL real (PGlite 0.5.11) con control negativo. Documentado en `supabase/README.md`.
- **Tarjetas**: el favorito está junto al enlace, no dentro de él (un botón dentro de un `<a>` no es HTML válido).

**Verificación:** `npm run ci` (lint, `astro check`, build y las tres suites de pruebas: 9 + 40 + 16). En el HTML generado con contenido de prueba (ya eliminado): controles de favorito y me gusta en la página de proyecto, índice con las versiones ES y EN, ranking y buscador presentes, sin atributos `style=`, sin scripts inline.

**Pendiente (requiere tus credenciales o servicios reales):**

- Crear el proyecto de Supabase, aplicar la migración y configurar `SUPABASE_URL`, `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`. Hasta entonces, ranking y contadores muestran su estado sin configurar.
- Desplegar el Worker de la API y poner su URL en `services.json` → `apiBaseUrl`.
- Crear la discusión de Giscus y completar `giscus.json`.
- Ejecutar las pruebas RLS contra el proyecto real y con la CLI de Supabase.
- **Pruebas en navegador: siguen sin ejecutarse.** Tampoco he probado el asistente, el perfil ni el morfado en un navegador real.

**Nota:** los nombres de los textos ES de esta fase usan voseo ("Buscá", "Intentalo", "Volvé"), como pediste.

## Fase 6: legalidad y AdSense

**Construido:**

- **Seis documentos legales** (términos, privacidad con referencias al RGPD, la CCPA y la Ley 25.326, y cookies), en español e inglés. Cada uno con el aviso «PENDIENTE DE REVISIÓN LEGAL — BORRADOR NO DEFINITIVO» visible y no ocultable. Los datos que faltan son marcadores visibles, no texto inventado.
- **Inventario de 34 datos pendientes** generado a partir del HTML construido (`docs/legal/pending-data.md`).
- **Consentimiento en tres decisiones independientes**: términos y privacidad obligatorios (casillas desmarcadas) y publicidad opcional. La aceptación solo se muestra como registrada si el servidor la confirma con su hora.
- **Registro en servidor**: ruta `/consent` en el Worker de la API, versión validada contra la del servidor, hora asignada por PostgreSQL, y tabla `legal_consents` **inmutable** (migración `0002`).
- **Gestor de preferencias de cookies** en la página de cookies, para cambiar la decisión de publicidad en cualquier momento.
- **Espacios de AdSense** con interruptor general: apagados no se renderizan ni reservan espacio; encendidos reservan altura por breakpoint (CLS). El script solo se carga con identificador válido y consentimiento.
- **CSP**: los dominios de Google se añaden solo si la publicidad está encendida.

**Verificado:**

- `npm run ci`: 0 errores, 0 avisos, 22 páginas. Suites: 30 unitarias, 40 + 28 de los Workers, 12 de build.
- Migración `0002` y pruebas RLS con PostgreSQL real (PGlite), con control negativo. Incluyen casos positivos y negativos, y el trigger de inmutabilidad probado como superusuario.
- Build con la publicidad encendida (temporal, restaurada): CSP correcta, sin unidades sin identificador, sin script insertado en el HTML.
- Build con la publicidad apagada (estado actual): sin dominios de Google, sin marcado publicitario, CSP sin cambios.
- Secretos: ninguno aparece en el sitio publicado.

**No verificado:**

- Pruebas en navegador (avisos, teclado, lectura de lectores de pantalla, responsive): no ejecutadas.
- Espacio publicitario en página de proyecto con la publicidad encendida: no hay proyectos publicados en el repositorio.
- Dominios de Google en la CSP: deben confirmarse con la documentación vigente antes de activar.
- Registro real en Supabase y en el Worker: pendiente de tus credenciales.

**Pendiente de tu parte:** datos del titular y los 34 marcadores; revisión profesional de los documentos; crear Supabase, aplicar `0001` y `0002`, desplegar el Worker de la API; decidir la activación de AdSense.

Procedimiento: `docs/setup/consent-and-adsense.md`. Alcance legal: `docs/legal/README.md`.
