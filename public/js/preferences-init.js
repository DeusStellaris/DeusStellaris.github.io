/*
 * Preferencias antes del primer pintado: tema y Lite Mode.
 * Script clásico y bloqueante en <head>: compatible con CSP 'self', sin inline.
 * Las claves de almacenamiento deben coincidir con src/features/preferences/storage.ts.
 * Si localStorage no está disponible, se usan los valores por defecto.
 */
(() => {
  var root = document.documentElement;

  var storedTheme = null;
  var storedLite = null;
  try {
    storedTheme = window.localStorage.getItem('deus:theme');
    storedLite = window.localStorage.getItem('deus:lite-mode');
  } catch {
    storedTheme = null;
    storedLite = null;
  }

  var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  var theme = storedTheme;
  if (theme !== 'light' && theme !== 'dark') {
    theme = prefersLight ? 'light' : 'dark';
  }
  root.setAttribute('data-theme', theme);

  if (storedLite === 'on') {
    root.classList.add('lite-mode');
  }
})();
