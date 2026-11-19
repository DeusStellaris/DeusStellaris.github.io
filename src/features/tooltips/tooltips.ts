import { tooltipFlipsUp, tooltipShift } from './tooltip-core';

/**
 * Posiciona los tooltips de [data-tooltip] (tooltip.css) al apuntarlos o enfocarlos: los desplaza
 * para que nunca se corten en el borde del viewport y los pasa arriba si no caben debajo.
 * El tamaño se lee del pseudo-elemento ::after ya renderizado; el resultado va en variables CSS.
 */

const SELECTOR = '[data-tooltip]';
let bound = false;

function place(control: HTMLElement): void {
  const box = getComputedStyle(control, '::after');
  const width = Number.parseFloat(box.width);
  const height = Number.parseFloat(box.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return;

  const rect = control.getBoundingClientRect();
  control.style.setProperty(
    '--tooltip-shift',
    `${tooltipShift(rect.right, width, document.documentElement.clientWidth)}px`,
  );
  control.toggleAttribute(
    'data-tooltip-up',
    tooltipFlipsUp(rect.bottom, rect.top, height, window.innerHeight),
  );
}

function onActivate(event: Event): void {
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest<HTMLElement>(SELECTOR);
  if (control) place(control);
}

/** Registra los listeners de documento una sola vez; sobreviven a View Transitions. */
export function initTooltips(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('pointerover', onActivate, { passive: true });
  document.addEventListener('focusin', onActivate, { passive: true });
}
