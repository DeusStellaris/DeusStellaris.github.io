import { readLocal, STORAGE_KEYS, writeLocal } from './storage';

export type Theme = 'light' | 'dark';

/** Inicializador único definido en public/js/preferences-init.js (cargado antes del primer pintado). */
declare global {
  interface Window {
    deusPreferences?: { apply(root: HTMLElement): void };
  }
}

const SYSTEM_LIGHT_QUERY = '(prefers-color-scheme: light)';
const TOGGLE_SELECTOR = '[data-theme-toggle]';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

/** Preferencia elegida por el visitante, o null si nunca eligió. */
export function getStoredTheme(): Theme | null {
  const value = readLocal(STORAGE_KEYS.theme);
  return isTheme(value) ? value : null;
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/**
 * Refleja el tema efectivo del documento en la etiqueta accesible de los botones. El icono no se
 * sincroniza aquí: ThemeToggle.astro lo deriva de <html data-theme> con CSS, sin estado propio.
 * Idempotente: puede llamarse en cualquier momento sin efectos secundarios.
 */
export function syncThemeToggles(): void {
  const theme = currentTheme();
  for (const button of document.querySelectorAll<HTMLButtonElement>(TOGGLE_SELECTOR)) {
    const label = theme === 'dark' ? button.dataset.labelToLight : button.dataset.labelToDark;
    if (label) {
      button.setAttribute('aria-label', label);
      button.dataset.tooltip = label;
    }
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  syncThemeToggles();
  // Otros módulos (p. ej. Giscus) reaccionan al cambio de tema.
  document.dispatchEvent(new CustomEvent('deus:theme-change', { detail: theme }));
}

/** Guarda la elección explícita del visitante y la aplica. */
export function setThemePreference(theme: Theme): void {
  writeLocal(STORAGE_KEYS.theme, theme);
  applyTheme(theme);
}

function toggleTheme(): void {
  setThemePreference(currentTheme() === 'dark' ? 'light' : 'dark');
}

/**
 * Registra los listeners una sola vez por carga de módulo. Se usa delegación de eventos
 * porque ClientRouter reemplaza los botones en cada navegación.
 */
export function initThemePreferences(): void {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(TOGGLE_SELECTOR)) toggleTheme();
  });

  // ClientRouter sustituye <html> (atributos y clases) en cada navegación. Antes del swap se
  // reaplican las preferencias (Lite Mode) y se fija en el documento nuevo el tema EFECTIVO actual,
  // sea elegido o detectado del sistema. Tras el swap se reafirma por si el reemplazo lo pisó.
  let themeBeforeSwap: Theme = currentTheme();
  document.addEventListener('astro:before-swap', (event) => {
    themeBeforeSwap = currentTheme();
    const incoming = event.newDocument.documentElement;
    window.deusPreferences?.apply(incoming);
    incoming.dataset.theme = themeBeforeSwap;
  });
  document.addEventListener('astro:after-swap', () => {
    document.documentElement.dataset.theme = themeBeforeSwap;
    syncThemeToggles();
  });

  // Si el visitante no eligió tema, seguir los cambios del sistema en vivo.
  window.matchMedia(SYSTEM_LIGHT_QUERY).addEventListener('change', (event) => {
    if (getStoredTheme() !== null) return;
    applyTheme(event.matches ? 'light' : 'dark');
  });

  // El botón nuevo de cada página refleja el tema efectivo del documento.
  document.addEventListener('astro:page-load', syncThemeToggles);
  syncThemeToggles();
}
