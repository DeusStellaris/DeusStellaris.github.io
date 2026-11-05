/**
 * Comentarios con Giscus. El script de giscus.app se inserta solo tras la acción del visitante.
 *
 * - Los atributos del script salen de la configuración (src/config/giscus.json) y del marcado
 *   del componente; nunca de la URL ni de datos no validados.
 * - Si la carga falla, se muestra un mensaje y el botón vuelve a estar disponible.
 * - Al cambiar el tema del sitio, el iframe de Giscus recibe el nuevo tema por postMessage.
 */

const ROOT_SELECTOR = '[data-giscus-root]';
const LOAD_SELECTOR = '[data-giscus-load]';
const GISCUS_ORIGIN = 'https://giscus.app';
const GISCUS_SCRIPT = 'https://giscus.app/client.js';

let listenersBound = false;

function giscusTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function loadComments(root: HTMLElement): void {
  if (root.dataset.loaded === 'true') return;
  const button = root.querySelector<HTMLButtonElement>(LOAD_SELECTOR);
  const status = root.querySelector<HTMLElement>('[data-giscus-status]');
  const { slug, locale, repo, repoId, category, categoryId, mapping } = root.dataset;
  if (!slug || !locale || !repo || !repoId || !category || !categoryId || !mapping) return;

  root.dataset.loaded = 'true';
  if (button) button.hidden = true;

  const script = document.createElement('script');
  script.src = GISCUS_SCRIPT;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-repo', repo);
  script.setAttribute('data-repo-id', repoId);
  script.setAttribute('data-category', category);
  script.setAttribute('data-category-id', categoryId);
  script.setAttribute('data-mapping', mapping);
  script.setAttribute('data-term', slug);
  script.setAttribute('data-strict', '1');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'bottom');
  script.setAttribute('data-lang', locale);
  script.setAttribute('data-theme', giscusTheme());

  script.addEventListener('error', () => {
    root.dataset.loaded = 'false';
    script.remove();
    if (button) button.hidden = false;
    if (status) status.textContent = root.dataset.msgLoadError ?? '';
  });

  root.append(script);
}

/** Envía el tema actual al iframe de Giscus, si ya existe. */
function pushThemeToGiscus(theme: 'light' | 'dark'): void {
  const frame = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
  frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, GISCUS_ORIGIN);
}

/** Activa la carga bajo demanda de comentarios. Idempotente. */
export function initComments(): void {
  if (!listenersBound) {
    listenersBound = true;
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(LOAD_SELECTOR);
      const root = button?.closest<HTMLElement>(ROOT_SELECTOR);
      if (root) loadComments(root);
    });
    document.addEventListener('deus:theme-change', (event) => {
      const theme = (event as CustomEvent<string>).detail;
      if (theme === 'light' || theme === 'dark') pushThemeToGiscus(theme);
    });
  }
}
