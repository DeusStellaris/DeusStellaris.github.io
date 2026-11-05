# Decap CMS

## Qué es

La interfaz de administración del portafolio. Está en `/admin/`, y sirve para crear, editar y eliminar proyectos, colaboradores y categorías, sin tocar código. Cada guardado es un commit en `main`, y GitHub Pages reconstruye el sitio.

## Qué hay en el repositorio

| Archivo                   | Función                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `public/admin/index.html` | Página de administración. Tiene CSP propia y `noindex`.                                                                           |
| `public/admin/config.yml` | Colecciones, campos y validaciones de Decap.                                                                                      |
| `scripts/sync-decap.mjs`  | Copia el bundle de Decap de la versión fijada a `public/admin/vendor/`.                                                           |
| `public/admin/vendor/`    | Generado. **No se versiona** (está en `.gitignore`). Lo crea `npm run sync:decap`, que se ejecuta antes de `dev`, `build` y `ci`. |

La versión de Decap es **3.17.1**, fijada con `--save-exact` en `package.json`.

## Estado de la autenticación: NO CONFIGURADA

El inicio de sesión **no funciona todavía**. `config.yml` tiene un marcador explícito en `backend.base_url`:

```yaml
base_url: https://REEMPLAZAR-worker-oauth.example.invalid
```

Mientras ese valor no se reemplace, Decap falla al autenticar. No hay ningún mecanismo simulado.

Para completarlo hace falta:

1. **Una OAuth App en GitHub** (cuenta `DeusStellaris`), con la URL de callback que indique el Worker.
2. **Un Cloudflare Worker** que haga el intercambio OAuth con PKCE. Sus secretos (`GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`) van solo como secretos del Worker (`wrangler secret put`), nunca en el repositorio ni en el navegador.
3. **Sustituir** `base_url` en `public/admin/config.yml` por la URL real del Worker.
4. **Acotar** `connect-src` de `public/admin/index.html` al dominio exacto del Worker (ahora usa `https://*.workers.dev`).

Este Worker no está construido todavía. Es la primera tarea pendiente antes de poder editar contenido.

## Decisiones de publicación

- **Publicación directa** (`publish_mode: simple`): cada guardado va a `main`. Es lo más simple para un solo administrador.
- **Flujo editorial** (`editorial_workflow`): crea pull requests para revisar antes de publicar. Se puede activar más adelante sin cambiar las colecciones.

## Idiomas

`i18n.structure: multiple_folders` con `es` por defecto. La colección `projects` tiene `i18n: true`, así que Decap guarda cada versión en `projects/<idioma>/`. **Hay que verificar en la documentación de Decap 3.17.1 que esta estructura genera las rutas que espera Astro.** Es una suposición que no he probado en el editor.

## Rutas de imágenes

- `media_folder` es `src/assets/uploads` (desde la raíz del repositorio).
- `public_folder` es relativa al archivo de contenido: `../../../assets/uploads` para proyectos y `../../assets/uploads` para colaboradores. Así Astro encuentra la imagen al compilar.
- La vista previa del editor puede no mostrar las imágenes con estas rutas relativas. Es una limitación conocida de Decap con este tipo de estructura. No afecta a la publicación.

## Cómo editar (para Deus, una vez configurado el Worker)

1. Entrar en `/admin/` y autenticarse con GitHub.
2. **Colaboradores**: crear primero las personas, porque los proyectos los referencian.
3. **Categorías**: crear las categorías con su sección.
4. **Proyectos**: crear en español. La versión en inglés es un archivo aparte con el mismo nombre.
5. Dejar **Estado** en _Borrador_ hasta que esté listo, y cambiarlo a _Publicado_.
6. Guardar. El sitio se reconstruye en GitHub Pages.

## Seguridad

- `/admin` tiene CSP propia, más permisiva que la del sitio, porque Decap usa estilos en línea. Esa excepción está documentada en `docs/security/csp.md`.
- El bundle se sirve desde el propio sitio. No se carga ningún script de CDN en `/admin`.
- Los `.map` no se publican.
- Hay avisos de dependencias en el bundle de Decap. Están documentados y pendientes de tu decisión en `docs/security/dependencies.md`.
