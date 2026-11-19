import type { APIRoute } from 'astro';
import siteConfig from '../config/site.json';

/** Manifiesto de la aplicación instalable. Las rutas respetan la base configurada del sitio. */
const BRAND_BACKGROUND = '#0B0914';
const BRAND_THEME = '#7C3AED';

export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL;
  const manifest = {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description.es,
    lang: siteConfig.defaultLocale,
    start_url: base,
    scope: base,
    id: base,
    display: 'standalone',
    background_color: BRAND_BACKGROUND,
    theme_color: BRAND_THEME,
    icons: [
      {
        src: `${base}assets/icons/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}assets/icons/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}assets/icons/icon-maskable-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
