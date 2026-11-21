import { showToast } from '../toast/toast';
import { followsProject, withProject } from './preferences';
import { loadPreferences, savePreferences } from './preferences-storage';
import {
  ensureSubscription,
  notificationPermission,
  pushSupport,
  requestPermission,
  syncSubscription,
} from './push-client';
import { DIALOG_SELECTOR, PREFERENCES_CHANGED, readConfig } from './push-config';

/**
 * Campanita de cada proyecto: sigue o deja de seguir ese proyecto en las preferencias locales (las
 * mismas que muestra el modal de notificaciones) y, con permiso y servicio, en el Worker.
 * Todo mensaje llega traducido en data-* del botón; aquí no hay idioma.
 */

const SELECTOR = '[data-follow-toggle]';
let bound = false;

function categories(): string[] {
  const dialog = document.querySelector<HTMLElement>(DIALOG_SELECTOR);
  return dialog ? readConfig(dialog).categories : [];
}

/** Refleja en cada campanita si su proyecto está seguido (aria-pressed, etiqueta y tooltip). */
export function syncFollowButtons(): void {
  const preferences = loadPreferences(categories());
  for (const button of document.querySelectorAll<HTMLButtonElement>(SELECTOR)) {
    const following = followsProject(preferences, button.dataset.slug ?? '');
    button.setAttribute('aria-pressed', String(following));
    const label = (following ? button.dataset.labelRemove : button.dataset.labelAdd) ?? '';
    button.setAttribute('aria-label', label);
    button.dataset.tooltip = label;
  }
}

function message(button: HTMLElement, key: string): string {
  return (button.dataset[key] ?? '').replace('{project}', button.dataset.title ?? '');
}

/** Alinea la suscripción del navegador y del Worker con las preferencias nuevas, si hay servicio. */
async function syncRemote(preferences: ReturnType<typeof loadPreferences>): Promise<void> {
  const dialog = document.querySelector<HTMLElement>(DIALOG_SELECTOR);
  if (!dialog || notificationPermission() !== 'granted') return;
  const config = readConfig(dialog);
  if (config.api === '' || config.vapid === '') return;
  const subscription = await ensureSubscription(config.vapid);
  if (subscription) await syncSubscription(config.api, subscription, preferences, config.locale);
}

async function toggle(button: HTMLButtonElement): Promise<void> {
  const slug = button.dataset.slug ?? '';
  const support = pushSupport();
  if (support !== 'ready') {
    showToast(message(button, support === 'ios-install' ? 'msgInstall' : 'msgUnsupported'));
    return;
  }

  const preferences = loadPreferences(categories());
  const following = followsProject(preferences, slug);
  if (following && preferences.mode === 'all') {
    showToast(message(button, 'msgAll'));
    return;
  }
  if (!following && notificationPermission() !== 'granted') {
    const permission = notificationPermission() === 'denied' ? 'denied' : await requestPermission();
    if (permission !== 'granted') {
      showToast(message(button, 'msgDenied'));
      return;
    }
  }

  const next = withProject(preferences, slug, !following);
  savePreferences(next);
  window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGED));
  showToast(message(button, following ? 'msgOff' : 'msgOn'));
  try {
    await syncRemote(next);
  } catch {
    showToast(message(button, 'msgError'));
  }
}

/** Registra los listeners una sola vez y sincroniza las campanitas de la página actual. */
export function initPushFollow(): void {
  if (!bound) {
    bound = true;
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(SELECTOR);
      if (button) void toggle(button);
    });
    window.addEventListener(PREFERENCES_CHANGED, syncFollowButtons);
    window.addEventListener('storage', syncFollowButtons);
  }
  syncFollowButtons();
}
