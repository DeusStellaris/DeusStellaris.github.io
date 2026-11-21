import { showToast } from '../toast/toast';
/**
 * Favoritos del perfil local. Se guardan en localStorage como una lista de slugs.
 *
 * - Lectura tolerante: un valor corrupto o con formato inesperado se descarta, sin romper la página.
 * - Sin persistencia disponible: se mantiene una copia en memoria y se informa al visitante
 *   (se pierde al recargar). Nunca se finge que se guardó.
 */

const STORAGE_KEY = 'deus:favorites';
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const MAX_FAVORITES = 200;
const TOGGLE_SELECTOR = '[data-favorite-toggle]';

/** Copia en memoria usada solo cuando localStorage no permite escribir. */
let memoryFallback: string[] | null = null;
let listenersBound = false;

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === 'string' && SLUG_PATTERN.test(value))
      .slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

function writeStored(slugs: readonly string[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    return true;
  } catch {
    return false;
  }
}

/** Slugs favoritos, en orden de inserción. */
export function listFavorites(): string[] {
  return memoryFallback ?? readStored();
}

/** Marca o desmarca un proyecto. `persisted` indica si el cambio sobrevivirá a una recarga. */
export function toggleFavorite(slug: string): { favorited: boolean; persisted: boolean } {
  if (!SLUG_PATTERN.test(slug)) return { favorited: false, persisted: false };

  const current = listFavorites();
  const alreadyFavorite = current.includes(slug);
  const next = alreadyFavorite
    ? current.filter((value) => value !== slug)
    : [...current, slug].slice(-MAX_FAVORITES);

  const persisted = writeStored(next);
  memoryFallback = persisted ? null : next;
  return { favorited: !alreadyFavorite, persisted };
}

/** Vacía la lista de favoritos. */
export function clearFavorites(): void {
  memoryFallback = null;
  writeStored([]);
}

/** Refleja en cada botón si el proyecto es favorito (aria-pressed y etiqueta). */
export function syncFavoriteButtons(): void {
  const favorites = new Set(listFavorites());
  for (const button of document.querySelectorAll<HTMLButtonElement>(TOGGLE_SELECTOR)) {
    const slug = button.dataset.slug ?? '';
    const favorited = favorites.has(slug);
    button.setAttribute('aria-pressed', String(favorited));
    const label = favorited ? button.dataset.labelRemove : button.dataset.labelAdd;
    if (label) button.setAttribute('aria-label', label);
  }
}

function handleToggle(button: HTMLButtonElement): void {
  const slug = button.dataset.slug ?? '';
  const result = toggleFavorite(slug);
  syncFavoriteButtons();

  if (!result.persisted) {
    showToast(button.dataset.msgUnavailable ?? '');
    return;
  }
  showToast(result.favorited ? (button.dataset.msgAdded ?? '') : (button.dataset.msgRemoved ?? ''));
}

/**
 * Registra los listeners una sola vez. La delegación de eventos cubre los botones
 * que ClientRouter reemplaza en cada navegación.
 */
export function initFavorites(): void {
  if (!listenersBound) {
    listenersBound = true;
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(TOGGLE_SELECTOR);
      if (button) handleToggle(button);
    });
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) syncFavoriteButtons();
    });
  }
  syncFavoriteButtons();
}
