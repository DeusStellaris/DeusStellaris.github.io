import { isLiteModeEnabled } from '../preferences/lite-mode';
import { readSession, STORAGE_KEYS, writeSession } from '../preferences/storage';

/**
 * Bienvenida: el logotipo aparece centrado, se desplaza a su posición en el header
 * y deja un destello sutil. Se reproduce una vez por sesión (sessionStorage).
 *
 * Se omite en Lite Mode y con prefers-reduced-motion. En cualquiera de esos casos
 * o si la API Web Animations no existe, el overlay se elimina y el logotipo queda
 * en su sitio sin animación. Nunca bloquea la navegación: el overlay no recibe eventos.
 */

const PLAY_DURATION_MS = 1000;
const SAFETY_TIMEOUT_MS = 2500;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function shouldPlay(): boolean {
  if (readSession(STORAGE_KEYS.introPlayed) === 'yes') return false;
  if (isLiteModeEnabled()) return false;
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return false;
  return typeof Element.prototype.animate === 'function';
}

function finish(overlay: HTMLElement): void {
  overlay.hidden = true;
  document.documentElement.classList.remove('intro-playing');
}

export function runIntro(): void {
  const overlay = document.querySelector<HTMLElement>('[data-intro]');
  if (!overlay) return;

  if (!shouldPlay()) {
    overlay.remove();
    return;
  }

  const logo = overlay.querySelector<HTMLImageElement>('img');
  const target = document.querySelector<HTMLElement>('[data-brand-mark]');
  if (!logo || !target) {
    overlay.remove();
    return;
  }

  writeSession(STORAGE_KEYS.introPlayed, 'yes');
  document.documentElement.classList.add('intro-playing');
  overlay.hidden = false;

  // Posición de inicio (centro de pantalla) y destino (logotipo del header).
  const start = logo.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);
  const scale = end.width / start.width;

  let done = false;
  const complete = (): void => {
    if (done) return;
    done = true;
    finish(overlay);
    target.classList.add('brand-glint');
  };

  logo
    .animate(
      [
        { transform: 'translate(0, 0) scale(0.92)', opacity: 0, offset: 0 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.25 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1, offset: 1 },
      ],
      { duration: PLAY_DURATION_MS, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'forwards' },
    )
    .addEventListener('finish', complete);

  overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
    delay: PLAY_DURATION_MS * 0.8,
    duration: PLAY_DURATION_MS * 0.2,
    fill: 'forwards',
  });

  // Red de seguridad: si la animación no termina (pestaña en segundo plano, etc.), cerrar igual.
  window.setTimeout(complete, SAFETY_TIMEOUT_MS);
}
