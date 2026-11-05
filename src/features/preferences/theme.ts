import { readLocal, STORAGE_KEYS, writeLocal } from './storage';

export type Theme = 'light' | 'dark';

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

/** Tema efectivo: elección guardada o, si no existe, el del sistema. */
export function resolveTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  return window.matchMedia(SYSTEM_LIGHT_QUERY).matches ? 'light' : 'dark';
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Refleja el tema actual en los botones (icono y etiqueta accesible). */
export function syncThemeToggles(): void {
  const theme = currentTheme();
  for (const button of document.querySelectorAll<HTMLButtonElement>(TOGGLE_SELECTOR)) {
    button.dataset.mode = theme;
    const label = theme === 'dark' ? button.dataset.labelToLight : button.dataset.labelToDark;
    if (label) button.setAttribute('aria-label', label);
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  syncThemeToggles();
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

  // Si el visitante no eligió tema, seguir los cambios del sistema en vivo.
  window.matchMedia(SYSTEM_LIGHT_QUERY).addEventListener('change', () => {
    if (getStoredTheme() === null) applyTheme(resolveTheme());
  });

  document.addEventListener('astro:page-load', syncThemeToggles);
  syncThemeToggles();
}
