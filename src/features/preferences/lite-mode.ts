import { readLocal, STORAGE_KEYS, writeLocal } from './storage';

/**
 * Lite Mode: modo de rendimiento elegido por el visitante.
 * Activo = clase `lite-mode` en <html>. Las reglas CSS de esa clase desactivan
 * animaciones, transiciones y efectos decorativos. `prefers-reduced-motion` sigue
 * vigente por separado: este modo nunca cambia esa preferencia del sistema.
 */

const TOGGLE_SELECTOR = '[data-lite-toggle]';

export function isLiteModeEnabled(): boolean {
  return readLocal(STORAGE_KEYS.liteMode) === 'on';
}

function applyLiteMode(enabled: boolean): void {
  document.documentElement.classList.toggle('lite-mode', enabled);
  syncLiteToggles();
}

export function syncLiteToggles(): void {
  const enabled = document.documentElement.classList.contains('lite-mode');
  for (const button of document.querySelectorAll<HTMLButtonElement>(TOGGLE_SELECTOR)) {
    button.setAttribute('aria-pressed', String(enabled));
  }
}

function toggleLiteMode(): void {
  const next = !document.documentElement.classList.contains('lite-mode');
  writeLocal(STORAGE_KEYS.liteMode, next ? 'on' : 'off');
  applyLiteMode(next);
}

/** Registra listeners una sola vez; ver la nota en theme.ts sobre ClientRouter. */
export function initLiteMode(): void {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(TOGGLE_SELECTOR)) toggleLiteMode();
  });

  document.addEventListener('astro:page-load', syncLiteToggles);
  syncLiteToggles();
}
