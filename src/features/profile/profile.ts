import { clearFavorites, listFavorites, toggleFavorite } from '../favorites/favorites';
import { loadSearchIndex } from '../search/search-client';
import type { SearchEntry } from '../search/search-core';

/**
 * Perfil local anónimo: favoritos y resumen de preferencias. No hay cuenta ni datos enviados.
 * Usa un <dialog> modal: el navegador gestiona el foco, la tecla Escape y el retorno del foco.
 */

const OPEN_SELECTOR = '[data-profile-open]';
const DIALOG_SELECTOR = '[data-profile-dialog]';

interface ProfileMessages {
  noFavorites: string;
  unavailable: string;
  remove: string;
  themeLight: string;
  themeDark: string;
  liteOn: string;
  liteOff: string;
}

function readMessages(dialog: HTMLDialogElement): ProfileMessages {
  const data = dialog.dataset;
  return {
    noFavorites: data.msgNoFavorites ?? '',
    unavailable: data.msgUnavailable ?? '',
    remove: data.msgRemove ?? '',
    themeLight: data.msgThemeLight ?? '',
    themeDark: data.msgThemeDark ?? '',
    liteOn: data.msgLiteOn ?? '',
    liteOff: data.msgLiteOff ?? '',
  };
}

/** Slug y idioma de una entrada de proyecto del índice ('project:<slug>:<locale>'). */
function projectSlugOf(entry: SearchEntry): string | null {
  if (entry.type !== 'project') return null;
  const parts = entry.id.split(':');
  return parts.length === 3 ? (parts[1] ?? null) : null;
}

async function renderFavorites(
  dialog: HTMLDialogElement,
  messages: ProfileMessages,
): Promise<void> {
  const list = dialog.querySelector<HTMLElement>('[data-profile-favorites]');
  if (!list) return;
  list.replaceChildren();

  const favorites = listFavorites();
  if (favorites.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'profile__empty';
    empty.textContent = messages.noFavorites;
    list.append(empty);
    return;
  }

  let titles = new Map<string, SearchEntry>();
  const locale = dialog.dataset.locale ?? 'es';
  try {
    const entries = await loadSearchIndex();
    titles = new Map(
      entries
        .filter((entry) => entry.locale === locale)
        .map((entry) => [projectSlugOf(entry) ?? '', entry] as const)
        .filter(([slug]) => slug !== ''),
    );
  } catch {
    // Sin índice: se muestra el aviso de no disponible en lugar del título.
  }

  const ul = document.createElement('ul');
  ul.className = 'profile__list';
  for (const slug of favorites) {
    const item = document.createElement('li');
    item.className = 'profile__item';

    const entry = titles.get(slug);
    if (entry) {
      const link = document.createElement('a');
      link.href = entry.href;
      link.textContent = entry.title;
      item.append(link);
    } else {
      const missing = document.createElement('span');
      missing.textContent = messages.unavailable;
      item.append(missing);
    }

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'profile__remove';
    remove.dataset.profileRemove = slug;
    remove.textContent = messages.remove;
    item.append(remove);
    ul.append(item);
  }
  list.append(ul);
}

function renderPreferences(dialog: HTMLDialogElement, messages: ProfileMessages): void {
  const theme = dialog.querySelector<HTMLElement>('[data-profile-theme]');
  if (theme) {
    theme.textContent =
      document.documentElement.dataset.theme === 'light' ? messages.themeLight : messages.themeDark;
  }
  const lite = dialog.querySelector<HTMLElement>('[data-profile-lite]');
  if (lite) {
    lite.textContent = document.documentElement.classList.contains('lite-mode')
      ? messages.liteOn
      : messages.liteOff;
  }
}

async function refresh(dialog: HTMLDialogElement): Promise<void> {
  const messages = readMessages(dialog);
  await renderFavorites(dialog, messages);
  renderPreferences(dialog, messages);
}

let listenersBound = false;

function bindOnce(): void {
  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target;

    const opener = target.closest<HTMLButtonElement>(OPEN_SELECTOR);
    if (opener) {
      const dialog = document.querySelector<HTMLDialogElement>(DIALOG_SELECTOR);
      if (!dialog) return;
      void refresh(dialog);
      if (!dialog.open) dialog.showModal();
      return;
    }

    const dialog = target.closest<HTMLDialogElement>(DIALOG_SELECTOR);
    if (!dialog) return;

    // Clic fuera: el fondo del modal es el propio <dialog> (sin padding).
    if (target === dialog) {
      dialog.close();
      return;
    }
    if (target.closest('[data-profile-close]')) {
      dialog.close();
      return;
    }
    const removeButton = target.closest<HTMLButtonElement>('[data-profile-remove]');
    if (removeButton?.dataset.profileRemove) {
      toggleFavorite(removeButton.dataset.profileRemove);
      void refresh(dialog);
      return;
    }
    if (target.closest('[data-profile-clear]')) {
      clearFavorites();
      void refresh(dialog);
    }
  });
}

/** Activa el perfil de la página actual. Idempotente. */
export function initProfile(): void {
  bindOnce();
}
