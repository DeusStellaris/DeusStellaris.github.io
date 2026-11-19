/**
 * Registro del Service Worker. Solo en producción (npm run build + npm run preview o el sitio
 * publicado): en desarrollo un worker cacheando módulos de Vite estorba. El alcance es la ruta base.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // Sin Service Worker el sitio funciona igual, solo sin instalación ni modo sin conexión.
    });
  });
}
