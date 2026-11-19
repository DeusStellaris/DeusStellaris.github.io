import type { APIRoute } from 'astro';
import serviceWorker from '../pwa/service-worker.js?raw';

/** Service Worker publicado en la raíz de la ruta base, para que su alcance cubra todo el sitio. */
const BUILD_VERSION = Date.now().toString(36);

export const GET: APIRoute = () => {
  const source = serviceWorker
    .replaceAll('__VERSION__', BUILD_VERSION)
    .replaceAll('__BASE__', import.meta.env.BASE_URL);
  return new Response(source, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
};
