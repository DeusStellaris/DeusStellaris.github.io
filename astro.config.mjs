// @ts-check
import { readFileSync } from 'node:fs';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';
import { noRawHtml } from './config/markdown/no-raw-html.mjs';

/**
 * Configuración del sitio leída desde un único archivo.
 * Cambiar el dominio o la ruta base (p. ej. para un dominio personalizado)
 * solo requiere editar src/config/site.json.
 */
const site = JSON.parse(readFileSync(new URL('./src/config/site.json', import.meta.url), 'utf8'));
const services = JSON.parse(
  readFileSync(new URL('./src/config/services.json', import.meta.url), 'utf8'),
);

// Origen de la API de me gusta (Worker), solo si ya está configurado. Sin URL no se abre ningún dominio.
const apiOrigins = services.apiBaseUrl ? [new URL(services.apiBaseUrl).origin] : [];

// Publicidad (AdSense). Con el interruptor apagado no se añade ningún dominio de Google a la CSP.
// Los dominios deben verificarse con la documentación vigente de Google antes de activarla.
const ads = JSON.parse(readFileSync(new URL('./src/config/ads.json', import.meta.url), 'utf8'));
const adsScriptHosts = ads.enabled === true ? ['https://pagead2.googlesyndication.com'] : [];
const adsFrameHosts =
  ads.enabled === true
    ? ['https://googleads.g.doubleclick.net', 'https://tpc.googlesyndication.com']
    : [];
const adsImageHosts =
  ads.enabled === true
    ? ['https://pagead2.googlesyndication.com', 'https://tpc.googlesyndication.com']
    : [];

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
        `img-src 'self' data: https://avatars.githubusercontent.com${adsImageHosts.map((h) => ` ${h}`).join('')}`,
        "font-src 'self'",
        `connect-src 'self' https://*.supabase.co${apiOrigins.map((origin) => ` ${origin}`).join('')}${adsScriptHosts.map((h) => ` ${h}`).join('')}`,
        `frame-src 'self' https://giscus.app${adsFrameHosts.map((h) => ` ${h}`).join('')}`,
      ],
      // Giscus carga su script desde giscus.app solo tras la acción del visitante (ver Comments.astro).
      // Astro 7 exige declarar script-src mediante scriptDirective; los hashes se añaden solos.
      scriptDirective: {
        resources: ["'self'", 'https://giscus.app', ...adsScriptHosts],
      },
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
      // Clave VAPID pública de Web Push (la privada vive solo como secreto del Worker).
      PUBLIC_VAPID_PUBLIC_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },

  // Hojas de estilo y recursos como archivos externos, nunca incrustados en el HTML ni como data:.
  // Así style-src y font-src se cumplen con 'self', sin hashes de estilos que Astro calcula
  // antes de la transformación final (la comprobación en navegador lo detectó).
  build: {
    inlineStylesheets: 'never',
  },

  vite: {
    build: {
      // Sin source maps publicados en producción.
      sourcemap: false,
      // Fuentes y SVG como archivos: font-src 'self' no admite data: URIs.
      assetsInlineLimit: 0,
    },
  },

  // Resaltado de código desactivado: Shiki genera estilos inline incompatibles con la CSP.
  // Se reevaluará en la Fase 4 si el contenido de proyectos incluye bloques de código.
  markdown: {
    // Procesador Sätteri (por defecto en Astro 7) con el plugin que elimina el HTML crudo.
    // Resaltado de código desactivado: Shiki genera estilos en línea incompatibles con la CSP.
    processor: satteri({ mdastPlugins: [noRawHtml] }),
    syntaxHighlight: false,
  },

  devToolbar: { enabled: false },
});
