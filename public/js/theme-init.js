/*
 * Inicialización del tema antes del primer pintado (evita parpadeo).
 * Script clásico y bloqueante en <head>: compatible con CSP 'self', sin inline.
 * Prioridad: elección guardada del visitante y, si no existe, preferencia del sistema.
 * Si localStorage no está disponible (modo privado o bloqueado), usa la preferencia del sistema.
 */
(() => {
  var STORAGE_KEY = 'deus:theme';
  var prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches === true;
  var theme = null;

  try {
    theme = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    theme = null;
  }

  if (theme !== 'light' && theme !== 'dark') {
    theme = prefersLight ? 'light' : 'dark';
  }

  document.documentElement.setAttribute('data-theme', theme);
})();
