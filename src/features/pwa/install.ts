import { showToast } from '../toast/toast';

/**
 * Instalación opcional de la app. Chromium avisa con `beforeinstallprompt`: se guarda el evento y
 * el botón del perfil lo dispara con un clic. Safari en iOS no tiene ese evento: ahí se muestra una
 * nota con los pasos manuales. Con la app ya instalada, nada de esto aparece.
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const BUTTON = '[data-pwa-install]';
const IOS_NOTE = '[data-install-ios]';
let deferred: InstallPromptEvent | null = null;
let bound = false;

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !('onbeforeinstallprompt' in window);
}

/** Muestra el botón solo si hay instalación posible y la nota solo en iOS sin instalar. */
export function syncInstallUi(): void {
  const installable = deferred !== null && !isStandalone();
  for (const button of document.querySelectorAll<HTMLElement>(BUTTON)) button.hidden = !installable;
  for (const note of document.querySelectorAll<HTMLElement>(IOS_NOTE)) {
    note.hidden = !(isIosSafari() && !isStandalone());
  }
}

async function install(button: HTMLElement): Promise<void> {
  if (!deferred) return;
  const prompt = deferred;
  deferred = null;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  if (outcome === 'accepted') showToast(button.dataset.msgInstalled ?? '');
  syncInstallUi();
}

/** Registra los listeners una sola vez (el evento llega pronto) y sincroniza la interfaz. */
export function initInstall(): void {
  if (!bound) {
    bound = true;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferred = event as InstallPromptEvent;
      syncInstallUi();
    });
    window.addEventListener('appinstalled', () => {
      deferred = null;
      syncInstallUi();
    });
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLElement>(BUTTON);
      if (button) void install(button);
    });
  }
  syncInstallUi();
}
