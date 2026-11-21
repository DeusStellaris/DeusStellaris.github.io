import { showToast } from '../toast/toast';

/**
 * Copiar el correo de contacto al portapapeles y confirmarlo con un toast. Si el navegador no
 * permite el portapapeles, avisa para que la persona lo seleccione a mano.
 */

const SELECTOR = '[data-copy-email]';
let bound = false;

export function initContact(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('click', async (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>(SELECTOR);
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail ?? '');
      showToast(button.dataset.msgCopied ?? '');
    } catch {
      showToast(button.dataset.msgFailed ?? '');
    }
  });
}
