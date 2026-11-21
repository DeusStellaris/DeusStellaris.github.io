import { tooltipPlacement } from './tooltip-core';

/**
 * Tooltips de [data-tooltip]. Un único cuadro vive en la capa superior del navegador (popover),
 * así ningún contenedor con overflow (modales, aviso de consentimiento) puede recortarlo. Se coloca
 * con coordenadas fijas dentro del viewport (ver tooltip-core.ts) y se oculta al salir, perder el
 * foco, desplazar o pulsar Escape. En pantallas táctiles solo aparece con el foco del teclado.
 */

const SELECTOR = '[data-tooltip]';
const LAYER_ID = 'tooltip-layer';
let bound = false;
let current: HTMLElement | null = null;

function layer(): HTMLElement {
  let element = document.getElementById(LAYER_ID);
  if (!element) {
    element = document.createElement('div');
    element.id = LAYER_ID;
    element.className = 'tooltip';
    element.setAttribute('role', 'tooltip');
    element.setAttribute('popover', 'manual');
    document.body.append(element);
  }
  return element;
}

function hide(): void {
  current = null;
  const element = document.getElementById(LAYER_ID);
  if (element?.matches(':popover-open')) element.hidePopover();
}

function show(control: HTMLElement): void {
  const text = control.dataset.tooltip ?? '';
  if (text === '') return;
  const element = layer();
  element.textContent = text;
  if (!element.matches(':popover-open')) element.showPopover();
  const { width, height } = element.getBoundingClientRect();
  const { left, top } = tooltipPlacement(
    control.getBoundingClientRect(),
    { width, height },
    { width: document.documentElement.clientWidth, height: window.innerHeight },
  );
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  current = control;
}

function onActivate(event: Event): void {
  if (event instanceof PointerEvent && event.pointerType === 'touch') return;
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest<HTMLElement>(SELECTOR);
  if (!control) return;
  // Con el foco solo cuenta la navegación real por teclado, no el retorno de foco tras cerrar un modal.
  if (event.type === 'focusin' && !control.matches(':focus-visible')) return;
  show(control);
}

function onLeave(event: Event): void {
  if (!(event.target instanceof Element)) return;
  if (current && event.target.closest(SELECTOR) === current) hide();
}

/** Registra los listeners de documento una sola vez; sobreviven a View Transitions. */
export function initTooltips(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('pointerover', onActivate, { passive: true });
  document.addEventListener('focusin', onActivate, { passive: true });
  document.addEventListener('pointerout', onLeave, { passive: true });
  document.addEventListener('focusout', onLeave, { passive: true });
  document.addEventListener('pointerdown', hide, { passive: true });
  document.addEventListener('scroll', hide, { passive: true, capture: true });
  // Abrir o cerrar un <dialog> (el evento no burbujea: se escucha en captura) limpia el tooltip.
  document.addEventListener('close', hide, { capture: true });
  document.addEventListener('cancel', hide, { capture: true });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
}
