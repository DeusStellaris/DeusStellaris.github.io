# Informe de preparación para lanzamiento

Estado verificado a la fecha de esta revisión. Cada afirmación indica cómo se comprobó: **automatizada** (Playwright, axe, `npm run ci`), **inspección** (lectura del código) o **no verificado** (requiere cuentas, despliegues o revisión humana).

## Veredicto

**NO APTO PARA LANZAMIENTO.**

Hay bloqueantes legales, de configuración y de seguridad que el repositorio no puede resolver. Detalle en la sección 4.

## 1. Cambios implementados en esta orden

- **Layout del footer:** `body` en columna flexible con altura mínima de viewport y `main` con `flex-grow: 1`. Sin `position` fijo ni márgenes por página (`src/styles/base.css`).
- **Lite Mode y animaciones:** auditado sin defecto invertido (ver sección 2). Sin cambios de lógica.
- **Consentimiento:** botones «Aceptar / Rechazar cookies opcionales» con la misma ruta de decisión, sin exigir términos. Visibles solo si hay una categoría opcional activa (`ads.enabled`), para no mostrar botones que no cambian nada (`ConsentBanner.astro`, `consent.ts`).
- **Política de reembolso (ES/EN):** nueva, en `src/legal/documents.ts`, con rutas `/reembolso/` y `/en/refunds/`. No inventa precios, plazos ni garantías; los marcadores pendientes quedan visibles.
- **Aviso de privacidad:** la sección 9 (ES y EN) describe el borrado: qué puede eliminarse, qué podría conservarse y el procedimiento. Al cambiar el texto se subió su versión a `2026-11-06.1`, para que los visitantes vuelvan a aceptarlo.
- **Acceso de baja:** enlace «Solicitar borrado de datos / Cancelar suscripción» en el footer (ES y EN), que lleva a la página de contacto. No hay correo inventado.
- **Versiones:** `workers/api/src/legal-versions.js` alineado con `legal.json`. La prueba de versiones compara solo los consentimientos (términos, privacidad, cookies); la versión del reembolso se muestra pero no es un consentimiento.
- **Registro de pendientes:** `docs/legal/pending-data.md` regenerado desde el HTML construido: **40 marcadores distintos**.
- **Licencias:** `docs/legal/licenses-and-attribution.md`.

## 2. Causas raíz y estado de Lite Mode y animaciones

**Footer.** El cuerpo tenía `min-height` pero no distribuía su contenido en columna, así que el pie seguía al último elemento y no al fondo del viewport. Corregido en la estructura global. Medido: en escritorio, en Juegos, Programas, Contacto y Freelance, el borde inferior del footer coincide con el borde del viewport (800 px). En móvil, las páginas más altas que el viewport muestran el footer al final del contenido, como corresponde.

**Lite Mode.** No está invertido. Por defecto no existe la clase `lite-mode` ni `deus:lite-mode` en `localStorage`, y las animaciones están activas. Medido en una sesión nueva: 26 animaciones infinitas en ejecución en el inicio. Al activar Lite Mode, 0. Al desactivarlo y recargar, vuelven. La preferencia persiste entre rutas.

**Por qué el usuario no las ve.** Con el código actual, las animaciones aparecen en una sesión limpia. Si en el navegador de localhost siguen sin verse, las causas posibles y verificables son:

1. `localStorage` conserva `deus:lite-mode = "on"` de una prueba anterior. Para comprobarlo: `localStorage.getItem('deus:lite-mode')` en la consola debe devolver `null` u `"off"`.
2. El sistema operativo tiene activado «reducir movimiento». Se respeta por diseño y desactiva la bienvenida y los efectos.
3. La bienvenida depende de `?intro=true` o de una sesión nueva; la marca de sesión (`sessionStorage`) impide repetirla en la misma pestaña, salvo con el parámetro (corregido en la fase anterior).

**Estado definitivo:** Lite Mode y `prefers-reduced-motion` desactivan los efectos; el sistema prevalece sobre la preferencia guardada, como exige la orden. Verificado: con reduced-motion del sistema, 0 animaciones infinitas aunque Lite Mode esté desactivado.

**Compilación.** Los seis `@keyframes` (`border-trace`, `nebula-breath`, `stardust`, `marble-shimmer`, `brand-glint`, `intro-veil`, `intro-content`) están en el CSS de producción. No se desactivó ninguna optimización.

## 3. Estado de cumplimiento

| Requisito                                         | Estado                                                                                                                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Opciones de aceptar y rechazar cookies opcionales | **Implementado**, condicionado a `ads.enabled`. Hoy no hay categorías opcionales activas, así que los botones no se muestran. Razón: no mostrar botones que no cambian nada.                                                      |
| Opciones opcionales desmarcadas al inicio         | **Verificado en código**: `ads.checked = adsGranted(record)`, por defecto falso.                                                                                                                                                  |
| AdSense sin consentimiento ni configuración real  | **Verificado en código**: el script solo se inserta si el interruptor y el consentimiento lo permiten. `ads.enabled` es `false` y `publisherId` es `null`. No se inventó ningún identificador.                                    |
| Términos, Privacidad, Cookies y Reembolso (ES/EN) | **Presentes**. Con marcadores pendientes de revisión profesional.                                                                                                                                                                 |
| Derechos ARCO y procedimiento                     | **Presentes** (secciones 8 y 9 del aviso), con el canal pendiente de confirmar.                                                                                                                                                   |
| Responsable y contacto                            | **Pendiente.** `legal.json` tiene `null` en nombre, domicilio, correo y contacto de protección de datos. Aparecen como marcadores.                                                                                                |
| Aviso de menores                                  | **Presente**, sin afirmar que una casilla sustituye el consentimiento parental. Edad mínima pendiente por jurisdicción.                                                                                                           |
| Acceso de baja / borrado visible                  | **Presente** en el footer. El borrado es **manual**: se gestiona por contacto. No existe procedimiento automatizado en el servidor; está marcado como pendiente.                                                                  |
| Reseñas, testimonios o estadísticas ficticias     | **Ninguno encontrado** (búsqueda en `src`, `public`, i18n y documentos). Los «me gusta» y el ranking vienen de la base de datos.                                                                                                  |
| Registro de consentimientos en servidor           | **No verificado.** Depende del Worker y de Supabase desplegados. Sin ellos, el sitio muestra «pendiente» y no da la aceptación por registrada. Es el comportamiento correcto, pero el registro legal no existe hasta desplegarlo. |

## 4. Bloqueantes y pendientes

### 4.1 Bloqueantes de lanzamiento

1. **Identidad y contacto del responsable** (`src/config/legal.json`, `controller`). Sin estos datos, el aviso de privacidad no cumple el requisito de identificar al responsable. No se inventaron.
2. **Revisión profesional de los documentos legales.** Hay 40 marcadores pendientes (ver `docs/legal/pending-data.md`), entre ellos la base jurídica de cada finalidad, las transferencias internacionales, los plazos de conservación y la clasificación de cookies.
3. **Panel de administración (`/admin/`) con vulnerabilidades en producción.** `npm audit --omit=dev` da 0, pero `decap-cms-app` está en `devDependencies` y su bundle se publica en `dist/admin/`. `npm audit` completo reporta 32 avisos: 7 de severidad alta, todos en la cadena de `decap-cms-app` (ReDoS en `trim`, `remark-parse`, `mdast-util-to-hast`, `remark-rehype`, `platejs`). `npm audit fix --force` no se aplicó, porque rompería el CMS. **Decisión necesaria del propietario:** actualizar Decap (si hay una versión sin estos avisos), aislar el panel o no publicar `/admin/` hasta resolverlo.
4. **Titularidad de los recursos visuales.** El origen y la licencia de las texturas de mármol y del logotipo no están verificados (ver `licenses-and-attribution.md`).

### 4.2 Pendientes legales o de configuración externa

- **Worker de autenticación de Decap (OAuth)**: no verificado. `docs/setup/decap-cms.md` describe el procedimiento. Sin él, el panel no puede editar contenido. No bloquea la publicación del sitio, que se puede construir con el contenido del repositorio.
- **Supabase**: las migraciones existen en `supabase/migrations/`, pero su aplicación en el proyecto real no está verificada. Sin ella, no hay registro de consentimientos en servidor (ver sección 3).
- **Cloudflare Workers** (`workers/api`, `workers/decap-auth`): despliegue no verificado. Los tests locales pasan.
- **Giscus**: desactivado (`repoId` es `null`). Hay que configurarlo en giscus.app antes de activar los comentarios.
- **AdSense**: no solicitado. El interruptor está en `false`; no se debe activar sin cuenta aprobada, `publisherId` y revisión de la política de consentimiento.
- **Correo de contacto**: `contact.json` y `legal.json` sin valor. Los enlaces de contacto y de borrado dependen de él, aunque hoy apunten a la página de contacto.

### 4.3 Mejoras no bloqueantes

- **Banner de consentimiento en escritorio**: en la primera visita tapa el final de la fila de enlaces del footer, incluido el de borrado. Se puede cerrar con «Más tarde». Conviene reubicarlo o compactarlo.
- **Efectos ambientales**: no medí FPS. Las tarjetas animan `--trace-angle` (repinta) y `opacity` sobre una sombra grande. Aceptable para cuatro tarjetas; conviene medirlo en un dispositivo real.
- **`docs/STATUS.md`** sigue describiendo hasta la Fase 4. Conviene actualizarlo o reemplazarlo por este informe.
- **Limpieza**: los PNG originales de mármol (≈21 MB) no se usan en el build y pueden retirarse.

## 5. Verificaciones realizadas

### Automatizadas

- **`npm run ci`**: código de salida 0. `biome check` sin diagnósticos; `astro check` con 0 errores (128 archivos); build completo; pruebas unitarias 32/32; pruebas de workers decap-auth 40/40 y de API (likes) 28/28; `test:build` 12/12.
- **Playwright E2E** contra el build: **312 de 312 pasan** (todos los proyectos).
- **axe-core** (`color-contrast`, `image-alt`, `button-name`, `link-name`, `label`), en modo claro y oscuro, móvil: `/juegos/`, `/programas/`, `/contacto/`, `/reembolso/`, `/terminos/`, `/privacidad/`, `/cookies/`. **0 violaciones** en las 14 combinaciones. Los elementos «incomplete» son texto sobre imágenes, que axe no puede medir.
- **Teclado**: 45 paradas de Tab en Inicio, en ambos temas. Todos los controles muestran el anillo `:focus-visible`. La única parada sin anillo es el `BODY` al dar la vuelta al documento, que no es un control.
- **Sin desbordamiento horizontal** en las páginas medidas (escritorio y móvil).
- **Consola**: sin errores de consola en las pruebas de navegación de la bienvenida, Lite Mode y navegación entre rutas. No se registró la consola en todas las capturas de axe.

### Inspección

- **Imágenes**: solo hay dos `<img>` directos. Ambos son el logotipo, con `alt=""` porque el nombre del sitio aparece en texto junto a la marca. Las imágenes de proyectos usan `cover.alt` del contenido, que el esquema exige (`min(1)`). No se encontraron imágenes informativas sin texto alternativo.
- **Sin pagos, reseñas ni estadísticas** inventadas (ver sección 3).

### No verificado

- **Lectores de pantalla** (NVDA, VoiceOver, TalkBack): no probados.
- **Dispositivos móviles reales**: el móvil se midió en viewport 390×844 con Chromium (Edge). No se probó Safari ni iOS.
- **Despliegue real**: Cloudflare, Supabase, GitHub OAuth y el registro de consentimientos en servidor no se pudieron verificar desde el repositorio.
- **Animaciones en movimiento y FPS**: verificadas por valores calculados en instantes controlados, no a ojo ni con medición de rendimiento.

## 6. Comandos y resultados exactos

- `npm run ci`: **exit 0** (ver sección 5).
- `npm audit --omit=dev`: **0 vulnerabilidades** (info 0, low 0, moderate 0, high 0, critical 0).
- `npm audit` (completo, incluye desarrollo): **32 vulnerabilidades** (low 1, moderate 24, high 7, critical 0). Las de severidad alta están en la cadena de `decap-cms-app`, que se publica en producción (ver 4.1).

## 7. Nota sobre el alcance

Esta revisión no declara que Deus cumpla de forma automática con ninguna normativa. Los documentos son borradores pendientes de revisión profesional y de los datos del responsable. La implementación contempla derechos y requisitos aplicables, y los huecos quedan marcados, no rellenados.
