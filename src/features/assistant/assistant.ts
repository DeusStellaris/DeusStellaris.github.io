import { initSearchWidgets } from '../search/search-widget';

/**
 * Asistente flotante. Es un <dialog> no modal: no bloquea la página ni el resto de la navegación.
 * Se cierra con Escape o con su botón, y devuelve el foco al botón que lo abrió.
 */

const ROOT_SELECTOR = '[data-assistant]';

let listenersBound = false;

function openAssistant(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>('[data-assistant-dialog]');
  const opener = root.querySelector<HTMLButtonElement>('[data-assistant-open]');
  if (!dialog || dialog.open) return;

  initSearchWidgets();
  dialog.show();
  opener?.setAttribute('aria-expanded', 'true');
  dialog.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
}

function closeAssistant(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>('[data-assistant-dialog]');
  const opener = root.querySelector<HTMLButtonElement>('[data-assistant-open]');
  if (!dialog?.open) return;

  dialog.close();
  opener?.setAttribute('aria-expanded', 'false');
  opener?.focus();
}

function bindOnce(): void {
  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const root = event.target.closest<HTMLElement>(ROOT_SELECTOR);
    if (!root) return;

    if (event.target.closest('[data-assistant-open]')) {
      const dialog = root.querySelector<HTMLDialogElement>('[data-assistant-dialog]');
      if (dialog?.open) closeAssistant(root);
      else openAssistant(root);
      return;
    }
    if (event.target.closest('[data-assistant-close]')) {
      closeAssistant(root);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = document.querySelector<HTMLElement>(
      `${ROOT_SELECTOR} [data-assistant-dialog][open]`,
    );
    const root = open?.closest<HTMLElement>(ROOT_SELECTOR);
    if (root) closeAssistant(root);
  });
}

/** Activa el asistente de la página actual. Idempotente. */
export function initAssistant(): void {
  bindOnce();
}
