# Política de seguridad de contenido (CSP)

## Dónde se define

`astro.config.mjs` → `security.csp.directives`. Astro genera la etiqueta `<meta http-equiv="content-security-policy">` en cada página y añade los hashes de los scripts y estilos que produce.

## Por qué `<meta>` y no cabecera

GitHub Pages no permite configurar cabeceras HTTP. Consecuencias:

- No se puede usar `frame-ancestors` (solo existe en cabeceras). La protección contra incrustación (clickjacking) no está disponible en este hosting.
- `report-uri` no se puede usar en `<meta>`.
- Si el hosting cambia a uno que permita cabeceras, la política debe moverse allí y añadir `frame-ancestors 'none'`.

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
- **Decap CMS (Fase 4):** `/admin` cargará Decap desde CDN. Necesitará una política propia, sin relajar la CSP del resto del sitio.
- **Giscus (Fase 5):** `frame-src https://giscus.app` ya está. Su script se añadirá a `script-src` cuando se implemente.

## Verificación

Tras cada build, comprobar en `dist/index.html` que no aparecen `unsafe-inline` ni `unsafe-eval`, y que no hay scripts inline sin hash. Esta comprobación se automatizará en la Fase 7.
