# Política de seguridad de contenido (CSP)

## Dónde se define

`astro.config.mjs` → `security.csp.directives`. Astro genera la etiqueta `<meta http-equiv="content-security-policy">` en cada página y añade los hashes de los scripts y estilos que produce.

## `<meta>` más cabecera (Cloudflare Pages)

La CSP principal sigue en `<meta>` porque Astro calcula hashes distintos por página. `public/_headers` agrega una
segunda CSP por cabecera con lo que `<meta>` no puede expresar: `frame-ancestors 'none'`, `object-src 'none'`,
`base-uri 'self'`, `form-action 'self'` y `upgrade-insecure-requests`. El navegador aplica ambas (intersección).

Cabeceras de todo el sitio: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (todo denegado salvo `fullscreen` y
`gamepad` propios para las demos), HSTS de dos años y `Cross-Origin-Opener-Policy: same-origin-allow-popups`
(Decap CMS necesita `window.opener` en su ventana de OAuth). Los Workers responden con `default-src 'none'`,
`frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Permissions-Policy` y HSTS. Pruebas: `tests/build/` y
`workers/*/test/`.

## Directivas actuales

| Directiva                  | Valor                                                | Motivo                                          |
| -------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| `default-src`              | `'self'`                                             | Base restrictiva                                |
| `script-src`               | `'self'` + hashes de Astro                           | Sin `unsafe-inline` ni `unsafe-eval`            |
| `style-src`                | `'self'` + hashes de Astro                           | Estilos de componentes generados por Astro      |
| `font-src`                 | `'self'`                                             | Fuentes autoalojadas                            |
| `img-src`                  | `'self' data: https://avatars.githubusercontent.com` | Imágenes locales y avatares de Giscus           |
| `connect-src`              | `'self' https://*.supabase.co`                       | Lectura pública de Supabase y API               |
| `frame-src`                | `https://giscus.app`                                 | Comentarios Giscus                              |
| `object-src`               | `'none'`                                             | Sin plugins                                     |
| `base-uri` / `form-action` | `'self'`                                             | Evita cambios de base y envíos a otros dominios |

## Excepciones pendientes

- **AdSense (Fase 6):** necesitará `script-src` para sus dominios de carga y `frame-src` para sus iframes. Se añadirán solo cuando la publicidad esté habilitada en `src/config/ads.json`. El bloque inline de AdSense se tratará con hashes. Antes de habilitarlo hay que verificar la documentación vigente de Google.
- **Decap CMS (`/admin`, Fase 4):** la página de administración tiene su propia CSP en `public/admin/index.html`. Es más permisiva que la del sitio en dos puntos, documentados aquí:
  - `style-src 'unsafe-inline'`: Decap genera estilos en línea en tiempo de ejecución.
  - `connect-src`: solo `https://api.github.com`. El login con GitHub es un popup (`window.open`), no una petición desde esta página.
    No hay `unsafe-eval` ni scripts de CDN: el bundle se sirve desde el propio sitio. La CSP del resto del sitio no cambia.
- **Giscus (Fase 5):** `frame-src https://giscus.app` ya está. Su script se añadirá a `script-src` cuando se implemente.

## Verificación

Tras cada build, comprobar en `dist/index.html` que no aparecen `unsafe-inline` ni `unsafe-eval`, y que no hay scripts inline sin hash. Esta comprobación se automatizará en la Fase 7.

## Fase 5: cambios en la CSP del sitio

- **script-src**: se añade `https://giscus.app` mediante `scriptDirective` (Astro 7 no admite `script-src` en `directives`). El script de Giscus solo se carga tras pulsar "Cargar comentarios".
- **connect-src**: `https://*.supabase.co` para las lecturas de contadores y ranking. Además, el origen exacto de la API de me gusta, pero solo cuando `services.json` tiene `apiBaseUrl`. Sin URL, no se abre ningún dominio adicional.
- **Sin `unsafe-inline` ni `unsafe-eval`** en ninguna página. El bootstrap de la interactividad es un módulo externo, así que no requiere hash.
- **Verificado** en el HTML generado: `script-src` contiene `'self'`, `https://giscus.app` y solo hashes; `connect-src` contiene solo los orígenes indicados.
