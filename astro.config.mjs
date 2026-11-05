// @ts-check
import { readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';

/**
 * Configuración del sitio leída desde un único archivo.
 * Cambiar el dominio o la ruta base (p. ej. para un dominio personalizado)
 * solo requiere editar src/config/site.json.
 */
const site = JSON.parse(readFileSync(new URL('./src/config/site.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: site.url,
  base: site.basePath,
  output: 'static',
  trailingSlash: 'always',

  i18n: {
    defaultLocale: site.defaultLocale,
    locales: site.locales,
    // Sin `fallback` de Astro: con él, Astro reescribe rutas EN a ES y genera un
    // aviso y 404 incorrectos. El fallback al español se aplica en los textos (i18n/index.ts).
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    sitemap({
      i18n: {
        defaultLocale: site.defaultLocale,
        locales: { es: 'es-AR', en: 'en-US' },
      },
    }),
  ],

  security: {
    // GitHub Pages no permite cabeceras HTTP: la CSP se entrega por <meta> y
    // no incluye frame-ancestors (solo válido en cabecera). Ver docs/security/csp.md.
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' data: https://avatars.githubusercontent.com",
        "font-src 'self'",
        "connect-src 'self' https://*.supabase.co",
        'frame-src https://giscus.app',
      ],
    },
  },

  // Variables públicas. Las credenciales de servidor nunca se declaran aquí.
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },

  vite: {
    build: {
      // Sin source maps publicados en producción.
      sourcemap: false,
    },
  },

  // Resaltado de código desactivado: Shiki genera estilos inline incompatibles con la CSP.
  // Se reevaluará en la Fase 4 si el contenido de proyectos incluye bloques de código.
  markdown: {
    syntaxHighlight: false,
  },

  devToolbar: { enabled: false },
});
