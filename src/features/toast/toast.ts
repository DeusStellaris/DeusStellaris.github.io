/**
 * Toasts: avisos breves y no intrusivos que confirman una acción. La región es a la vez la zona
 * aria-live, así que el lector de pantalla anuncia el mismo texto que se ve. Los mensajes llegan
 * ya traducidos; este módulo no conoce idiomas. Con Modo Lite no hay animación (ver toast.css). Un popover manual lo mantiene sobre los modales.
 */

const REGION_ID = 'toast-region';
const MAX_VISIBLE = 3;
const DURATION_MS = 3500;

function region(): HTMLElement {
  let element = document.getElementById(REGION_ID);
  if (!element) {
    element = document.createElement('div');
    element.id = REGION_ID;
    element.className = 'toast-region';
    // popover manual: vive en la capa superior, así se ve también sobre los <dialog> modales.
    element.setAttribute('popover', 'manual');
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    document.body.append(element);
  }
  return element;
}

/** Muestra un aviso y lo retira solo. Un mensaje vacío se ignora. */
export function showToast(message: string): void {
  if (message === '') return;
  const container = region();
  const toast = document.createElement('p');
  toast.className = 'toast';
  toast.textContent = message;
  container.append(toast);
  if (container.matches(':popover-open')) container.hidePopover();
  container.showPopover();
  while (container.children.length > MAX_VISIBLE) container.firstElementChild?.remove();
  setTimeout(() => {
    toast.remove();
    if (container.childElementCount === 0 && container.matches(':popover-open')) {
      container.hidePopover();
    }
  }, DURATION_MS);
}
