/** Configuración del servicio de avisos, leída de los atributos data-* del diálogo (NotificationsDialog). */

export interface PanelConfig {
  api: string;
  vapid: string;
  locale: string;
  categories: string[];
}

export const DIALOG_SELECTOR = '[data-push-dialog]';

export function readConfig(dialog: HTMLElement): PanelConfig {
  const { api, vapid, locale, categories } = dialog.dataset;
  return {
    api: api ?? '',
    vapid: vapid ?? '',
    locale: locale ?? 'es',
    categories: (categories ?? '').split(',').filter(Boolean),
  };
}

/** Evento que avisa a campanitas y modal de que las preferencias de avisos cambiaron. */
export const PREFERENCES_CHANGED = 'deus:push-preferences-changed';
