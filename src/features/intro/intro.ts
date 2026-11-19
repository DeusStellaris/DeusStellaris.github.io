import { STORAGE_KEYS, writeSession } from '../preferences/storage';

/**
 * Ciclo de vida de la bienvenida (IntroOverlay.astro).
 *
 * - La decisión (sesión o ?intro=true) la toma public/js/preferences-init.js antes del primer
 *   pintado y la refleja en html.intro-playing. Es independiente del Lite Mode.
 * - Astro reemplaza <html> (con su clase) en cada navegación de View Transitions. Tras un swap la
 *   clase ya no está y el overlay nuevo se retira sin reproducirse.
 * - runIntro es idempotente: cada overlay se inicia como máximo una vez.
 * - Toda la secuencia usa Web Animations sobre transform y opacity (aceleradas por GPU, sin filtros
 *   ni sombras), así el Modo Lite no la afecta: aparición, pausa de reconocimiento y vuelo del
 *   logotipo a la posición del encabezado mientras el velo se desvanece. Se mide el destino al partir.
 * - Con prefers-reduced-motion y Modo Lite activo no hay desplazamiento: el saludo aparece y se desvanece en su lugar.
 */

const FADE_IN_MS = 500;
const HOLD_UNTIL_MS = 1100;
const FLIGHT_MS = 1100;
const SAFETY_TIMEOUT_MS = HOLD_UNTIL_MS + FLIGHT_MS + 800;
const FLIGHT_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const FILL: KeyframeAnimationOptions = { fill: 'forwards' };
const FADE_OUT: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];

function flightKeyframes(from: DOMRect, to: DOMRect): Keyframe[] {
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  return [
    { transform: 'translate3d(0, 0, 0) scale(1)' },
    { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${to.width / from.width})` },
  ];
}

/** Espera el primer pintado real: dos frames, para que la bienvenida nunca se saltee antes de verse. */
function afterFirstPaint(callback: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

function play(overlay: HTMLElement, finish: () => void): void {
  const content = overlay.querySelector<HTMLElement>('[data-intro-content]');
  const mark = overlay.querySelector<HTMLElement>('[data-intro-mark]');
  const text = overlay.querySelector<HTMLElement>('[data-intro-text]');
  const veil = overlay.querySelector<HTMLElement>('[data-intro-veil]');
  const target = document.querySelector<HTMLElement>('[data-logo-mark]');
  if (!content || !mark || !veil) {
    finish();
    return;
  }

  // El movimiento reducido del SO solo aplica con Modo Lite activo: apagarlo es una decisión explícita.
  const reduced =
    window.matchMedia(REDUCED_MOTION_QUERY).matches &&
    document.documentElement.classList.contains('lite-mode');
  const appear: Keyframe[] = reduced
    ? [{ opacity: 0 }, { opacity: 1 }]
    : [
        { opacity: 0, transform: 'translateY(0.75rem)' },
        { opacity: 1, transform: 'translateY(0)' },
      ];
  content.animate(appear, { ...FILL, duration: FADE_IN_MS, easing: 'ease-out' });

  window.setTimeout(() => {
    if (reduced || !target) {
      const fade = { ...FILL, duration: FLIGHT_MS * 0.6, easing: 'ease-in-out' };
      content.animate(FADE_OUT, fade);
      veil.animate(FADE_OUT, fade).addEventListener('finish', finish);
      return;
    }
    const flight = { ...FILL, duration: FLIGHT_MS, easing: FLIGHT_EASING };
    mark.animate(
      flightKeyframes(mark.getBoundingClientRect(), target.getBoundingClientRect()),
      flight,
    );
    text?.animate(FADE_OUT, { ...flight, duration: FLIGHT_MS * 0.4, easing: 'ease-out' });
    veil.animate(FADE_OUT, flight).addEventListener('finish', finish);
  }, HOLD_UNTIL_MS);
}

export function runIntro(): void {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>('[data-intro]');
  if (!overlay) return;

  if (!root.classList.contains('intro-playing')) {
    overlay.remove();
    return;
  }
  if (overlay.dataset.introStarted === 'yes') return;
  overlay.dataset.introStarted = 'yes';

  writeSession(STORAGE_KEYS.introPlayed, 'yes');

  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    root.classList.remove('intro-playing');
    overlay.remove();
  };
  window.setTimeout(finish, SAFETY_TIMEOUT_MS);
  afterFirstPaint(() => play(overlay, finish));
}
