/*
 * Inicializador único de preferencias: tema, Lite Mode (activo por defecto) y decisión de la bienvenida.
 * Script clásico y bloqueante en <head>: se ejecuta antes del primer pintado y cumple CSP 'self'.
 *
 * Expone window.deusPreferences.apply(root). ClientRouter reemplaza <html> en cada navegación
 * (swapRootAttributes), así que src/features/preferences/theme.ts llama a apply() sobre el
 * documento nuevo antes del swap. Así hay una sola implementación de la lógica de tema.
 *
 * Las claves de almacenamiento deben coincidir con src/features/preferences/storage.ts.
 * Si el almacenamiento no está disponible, se usan los valores por defecto.
 */
(() => {
  var KEYS = {
    theme: 'deus:theme',
    liteMode: 'deus:lite-mode',
    introPlayed: 'deus:intro-played',
  };
  var INTRO_FAILSAFE_MS = 6000;
  var SYSTEM_LIGHT_QUERY = '(prefers-color-scheme: light)';

  // Recibe el nombre del almacén para que el acceso (que puede lanzar) quede dentro del try.
  function read(storeName, key) {
    try {
      return window[storeName].getItem(key);
    } catch {
      return null;
    }
  }

  function matches(query) {
    return window.matchMedia(query).matches;
  }

  function applyPreferences(root) {
    var stored = read('localStorage', KEYS.theme);
    var theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : matches(SYSTEM_LIGHT_QUERY)
          ? 'light'
          : 'dark';
    root.setAttribute('data-theme', theme);
    // Lite Mode activo salvo que el visitante lo haya desactivado de forma explícita.
    root.classList.toggle('lite-mode', read('localStorage', KEYS.liteMode) !== 'off');
  }

  var root = document.documentElement;
  applyPreferences(root);

  // La bienvenida se decide aquí, antes del primer pintado. El CSS del overlay solo se muestra
  // con html.intro-playing, así que nunca aparece un destello antes de comprobar las condiciones.
  //
  // Política (data-intro-policy, inyectado por BaseLayout):
  //   - 'session' (producción): una vez por sesión, según sessionStorage.
  //   - 'always'  (npm run dev): en cada carga completa, sin que la sesión la bloquee.
  // Depuración en cualquier entorno, mediante la URL (no cambia la sesión de los visitantes):
  //   - ?intro=true   fuerza la bienvenida en esta carga, ignorando sessionStorage (alias: ?intro=1).
  //   - ?intro=reset  borra la marca de sesión y fuerza la bienvenida en esta carga.
  // La bienvenida es independiente del Lite Mode. Con prefers-reduced-motion se reproduce solo
  // como desvanecimiento (src/features/intro/intro.ts).
  var introParam = null;
  try {
    introParam = new URLSearchParams(window.location.search).get('intro');
  } catch {
    introParam = null;
  }
  if (introParam === 'reset') {
    try {
      window.sessionStorage.removeItem(KEYS.introPlayed);
    } catch {
      // Sin sessionStorage no hay marca que borrar.
    }
  }
  // ?intro=true (y el alias ?intro=1) ignora el bloqueo de sessionStorage: prioridad absoluta.
  var forced = introParam === 'true' || introParam === '1' || introParam === 'reset';
  var policy = root.getAttribute('data-intro-policy');
  var eligible =
    forced || policy === 'always' || read('sessionStorage', KEYS.introPlayed) !== 'yes';
  if (eligible) {
    root.classList.add('intro-playing');
    // Red de seguridad: si el script de la bienvenida no llega a ejecutarse, el velo se retira solo.
    window.setTimeout(() => root.classList.remove('intro-playing'), INTRO_FAILSAFE_MS);
  }

  window.deusPreferences = { apply: applyPreferences };
})();
