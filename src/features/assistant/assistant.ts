import { initSearchWidgets } from '../search/search-widget';

/**
 * Búsqueda global. Es un <dialog> modal (el navegador gestiona foco, Escape y retorno del foco).
 * Se abre con el botón del encabezado, Ctrl/Cmd + K o "/" fuera de un campo de texto, y se cierra
 * con su ×, con Escape o haciendo clic en el fondo.
 */

const DIALOG_SELECTOR = '[data-assistant-dialog]';
let listenersBound = false;

function dialogElement(): HTMLDialogElement | null {
  return document.querySelector<HTMLDialogElement>(DIALOG_SELECTOR);
}

function openAssistant(): void {
  const dialog = dialogElement();
  if (!dialog || dialog.open) return;
  initSearchWidgets();
  dialog.showModal();
  dialog.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches('input, textarea, select'))
  );
}

function bindOnce(): void {
  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[data-assistant-open]')) {
      openAssistant();
      return;
    }
    if (event.target.closest('[data-assistant-close]')) {
      dialogElement()?.close();
      return;
    }
    // Clic en el fondo: el propio <dialog> (sin padding) es el área fuera del contenido.
    if (event.target === dialogElement()) dialogElement()?.close();
  });

  document.addEventListener('keydown', (event) => {
    const quick = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    const slash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (quick || (slash && !isTypingTarget(event.target))) {
      if (!dialogElement()) return;
      event.preventDefault();
      openAssistant();
    }
  });
}

/** Activa la búsqueda global de la página actual. Idempotente. */
export function initAssistant(): void {
  bindOnce();
}
