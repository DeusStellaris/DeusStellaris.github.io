import { normalizePreferences, type PushMode, type PushPreferences } from './preferences';
import { loadPreferences, savePreferences } from './preferences-storage';
import {
  cancelSubscription,
  currentSubscription,
  ensureSubscription,
  notificationPermission,
  type PushSupport,
  pushSupport,
  requestPermission,
  syncSubscription,
} from './push-client';

/**
 * Panel de preferencias de notificaciones (NotificationsDialog.astro).
 * Guarda las preferencias en este navegador y, cuando hay permiso, suscripción y servicio
 * configurados, las sincroniza con el Worker. Sin servicio configurado el panel funciona igual y
 * lo informa: las preferencias quedan listas para cuando se active.
 */

const OPEN_SELECTOR = '[data-push-open]';
const DIALOG_SELECTOR = '[data-push-dialog]';
const DETAIL_FIELDS = ['title', 'description', 'battery', 'data'] as const;

type StatusKey =
  | 'off'
  | 'needsPermission'
  | 'active'
  | 'denied'
  | 'unsupported'
  | 'unconfigured'
  | 'saving'
  | 'error';

interface PanelConfig {
  api: string;
  vapid: string;
  locale: string;
  categories: string[];
}

function readConfig(dialog: HTMLDialogElement): PanelConfig {
  const { api, vapid, locale, categories } = dialog.dataset;
  return {
    api: api ?? '',
    vapid: vapid ?? '',
    locale: locale ?? 'es',
    categories: (categories ?? '').split(',').filter(Boolean),
  };
}

function inputs(dialog: HTMLElement, name: string): HTMLInputElement[] {
  return [...dialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
}

function readForm(dialog: HTMLDialogElement, config: PanelConfig): PushPreferences {
  const mode = inputs(dialog, 'push-mode').find((input) => input.checked)?.value;
  const checked = (name: string) =>
    inputs(dialog, name)
      .filter((input) => input.checked)
      .map((input) => input.value);
  return normalizePreferences(
    { mode, categories: checked('push-category'), projects: checked('push-project') },
    config.categories,
  );
}

function writeForm(dialog: HTMLDialogElement, preferences: PushPreferences): void {
  for (const input of inputs(dialog, 'push-mode')) input.checked = input.value === preferences.mode;
  for (const input of inputs(dialog, 'push-category'))
    input.checked = preferences.categories.includes(input.value);
  for (const input of inputs(dialog, 'push-project'))
    input.checked = preferences.projects.includes(input.value);

  const categories = dialog.querySelector<HTMLElement>('[data-push-categories]');
  const projects = dialog.querySelector<HTMLElement>('[data-push-projects]');
  if (categories) categories.hidden = preferences.mode !== 'categories';
  if (projects) projects.hidden = preferences.mode !== 'projects';
}

function showDetail(dialog: HTMLDialogElement, source: HTMLElement): void {
  for (const field of DETAIL_FIELDS) {
    const target = dialog.querySelector<HTMLElement>(`[data-out-${field}]`);
    const text = source.getAttribute(`data-detail-${field}`);
    if (target && text) target.textContent = text;
  }
}

function showDetailForMode(dialog: HTMLDialogElement, mode: PushMode): void {
  const option = dialog
    .querySelector<HTMLInputElement>(`input[name="push-mode"][value="${mode}"]`)
    ?.closest<HTMLElement>('[data-push-option]');
  if (option) showDetail(dialog, option);
}

function setStatus(dialog: HTMLDialogElement, key: StatusKey): void {
  const status = dialog.querySelector<HTMLElement>('[data-push-status]');
  if (status) status.textContent = dialog.getAttribute(`data-status-${key}`) ?? '';
}

function setEnableButton(dialog: HTMLDialogElement, visible: boolean, disabled: boolean): void {
  const button = dialog.querySelector<HTMLButtonElement>('[data-push-enable]');
  if (!button) return;
  button.hidden = !visible;
  button.disabled = disabled;
}

/** Estado visible según preferencias, soporte del navegador, permiso y suscripción actual. */
async function refreshStatus(dialog: HTMLDialogElement, config: PanelConfig): Promise<void> {
  const preferences = readForm(dialog, config);
  const support: PushSupport = pushSupport();
  const notice = dialog.querySelector<HTMLElement>('[data-push-ios]');
  if (notice) notice.hidden = support !== 'ios-install';

  if (preferences.mode === 'none') {
    setEnableButton(dialog, false, false);
    setStatus(dialog, 'off');
    return;
  }
  if (support === 'unsupported') {
    setEnableButton(dialog, false, false);
    setStatus(dialog, 'unsupported');
    return;
  }
  if (support === 'ios-install') {
    setEnableButton(dialog, true, true);
    setStatus(dialog, 'needsPermission');
    return;
  }

  const permission = notificationPermission();
  if (permission === 'denied') {
    setEnableButton(dialog, false, false);
    setStatus(dialog, 'denied');
    return;
  }
  if (permission !== 'granted') {
    setEnableButton(dialog, true, false);
    setStatus(dialog, 'needsPermission');
    return;
  }

  setEnableButton(dialog, false, false);
  const ready = config.api !== '' && config.vapid !== '' && (await currentSubscription()) !== null;
  setStatus(dialog, ready ? 'active' : 'unconfigured');
}

/** Persiste las preferencias y deja la suscripción (navegador y servidor) alineada con ellas. */
async function apply(dialog: HTMLDialogElement, config: PanelConfig): Promise<void> {
  const preferences = readForm(dialog, config);
  savePreferences(preferences);
  setStatus(dialog, 'saving');
  try {
    if (preferences.mode === 'none') {
      await cancelSubscription(config.api);
    } else if (notificationPermission() === 'granted' && config.api !== '' && config.vapid !== '') {
      const subscription = await ensureSubscription(config.vapid);
      if (subscription)
        await syncSubscription(config.api, subscription, preferences, config.locale);
    }
    await refreshStatus(dialog, config);
  } catch {
    setStatus(dialog, 'error');
  }
}

function openDialog(dialog: HTMLDialogElement): void {
  const config = readConfig(dialog);
  const preferences = loadPreferences(config.categories);
  writeForm(dialog, preferences);
  showDetailForMode(dialog, preferences.mode);
  void refreshStatus(dialog, config);
  if (!dialog.open) dialog.showModal();
}

async function enableNotifications(dialog: HTMLDialogElement): Promise<void> {
  await requestPermission();
  await apply(dialog, readConfig(dialog));
}

let listenersBound = false;

function bindOnce(): void {
  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target;

    if (target.closest(OPEN_SELECTOR)) {
      const dialog = document.querySelector<HTMLDialogElement>(DIALOG_SELECTOR);
      if (dialog) openDialog(dialog);
      return;
    }
    const dialog = target.closest<HTMLDialogElement>(DIALOG_SELECTOR);
    if (!dialog) return;
    if (target.closest('[data-push-close]')) dialog.close();
    else if (target.closest('[data-push-enable]')) void enableNotifications(dialog);
  });

  document.addEventListener('change', (event) => {
    if (!(event.target instanceof Element)) return;
    const dialog = event.target.closest<HTMLDialogElement>(DIALOG_SELECTOR);
    if (!dialog) return;
    const config = readConfig(dialog);
    writeForm(dialog, readForm(dialog, config));
    showDetailForMode(dialog, readForm(dialog, config).mode);
    void apply(dialog, config);
  });

  // El panel de detalle sigue a la opción señalada con el mouse o el teclado.
  const follow = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const dialog = event.target.closest<HTMLDialogElement>(DIALOG_SELECTOR);
    const option = event.target.closest<HTMLElement>('[data-push-option]');
    if (dialog && option) showDetail(dialog, option);
  };
  document.addEventListener('mouseover', follow);
  document.addEventListener('focusin', follow);
}

/** Activa el panel de notificaciones. Idempotente. */
export function initPushPanel(): void {
  bindOnce();
}
