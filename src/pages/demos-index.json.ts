import type { APIRoute } from 'astro';
import { listDemos } from '../services/demos';

/** Slugs de las demos publicadas. El Worker de la API lo usa para aceptar reseñas solo de demos reales. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ slugs: listDemos().map((demo) => demo.slug) }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
