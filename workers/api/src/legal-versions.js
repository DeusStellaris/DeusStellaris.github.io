/**
 * Versiones vigentes de los documentos legales, según el servidor.
 * Deben coincidir con src/config/legal.json del sitio: una prueba lo verifica en cada ejecución.
 * El servidor rechaza cualquier registro cuya versión no coincida: el cliente no puede
 * declarar una versión que no existe.
 */

export const LEGAL_VERSIONS = Object.freeze({
  terms: '2026-11-05.1',
  privacy: '2026-11-19.1',
  cookies: '2026-11-19.1',
});
