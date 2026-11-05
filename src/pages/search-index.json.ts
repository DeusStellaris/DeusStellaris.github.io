import { buildSearchEntries } from '../services/search-index';

/**
 * Índice de búsqueda estático. Se genera en build (sin ruta dinámica ni base de datos),
 * así que el buscador funciona sin consultas a un servidor en tiempo de ejecución.
 */
export async function GET() {
  const entries = await buildSearchEntries();
  return new Response(JSON.stringify({ version: 1, entries }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
