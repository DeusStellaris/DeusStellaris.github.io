/**
 * Ruta pública de un recurso de /public, respetando la ruta base del sitio.
 * Ej.: publicAssetUrl('assets/icons/sun.svg') → '/assets/icons/sun.svg' (o con el base configurado).
 */
export function publicAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
