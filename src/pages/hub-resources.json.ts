import type { APIRoute } from 'astro';
import hub from '../config/hub-resources.json';

/** Catálogo del DeusDeck Hub, consumido por la galería y a futuro por la app de escritorio. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ resources: hub.resources }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
