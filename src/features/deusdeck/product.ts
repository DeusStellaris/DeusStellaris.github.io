import { detectOs } from './os-detect';

/**
 * Ficha de DeusDeck (DeusDeck/DeusDeckProduct.astro): muestra el sistema detectado, avisa si no es
 * Windows (los instaladores actuales son solo para Windows) y cambia las notas según la versión elegida.
 */

const ROOT_SELECTOR = '[data-deck-product]';

function initProduct(root: HTMLElement): void {
  if (root.dataset.deckReady === 'true') return;
  root.dataset.deckReady = 'true';

  const os = detectOs(navigator.userAgent, navigator.maxTouchPoints);
  const names = JSON.parse(root.dataset.osNames ?? '{}') as Record<string, string>;
  const label = root.querySelector<HTMLElement>('[data-deck-os]');
  if (label) label.textContent = names[os] ?? os;

  const supported = os === 'windows';
  const notice = root.querySelector<HTMLElement>('[data-deck-unsupported]');
  if (notice) notice.hidden = supported;
  for (const installers of root.querySelectorAll<HTMLElement>('[data-deck-installers]')) {
    installers.hidden = !supported;
  }

  const select = root.querySelector<HTMLSelectElement>('[data-deck-version]');
  select?.addEventListener('change', () => {
    for (const panel of root.querySelectorAll<HTMLElement>('[data-deck-release]')) {
      panel.hidden = panel.dataset.deckRelease !== select.value;
    }
  });
}

/** Activa la ficha de la página actual. Idempotente. */
export function initDeckProduct(): void {
  for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) initProduct(root);
}
