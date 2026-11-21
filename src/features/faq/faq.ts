/**
 * Acordeón de preguntas frecuentes. Cada botón controla su panel con aria-expanded y `hidden`;
 * Enter y Espacio funcionan de forma nativa por ser <button>. Flechas y Home/End mueven el foco
 * entre preguntas. La entrada del panel se anima por CSS (transform y opacity).
 */

const TRIGGER_SELECTOR = '.faq__trigger';

function toggle(trigger: HTMLButtonElement): void {
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  trigger.setAttribute('aria-expanded', String(!expanded));
  const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
  if (panel) panel.hidden = expanded;
}

function moveFocus(trigger: HTMLButtonElement, key: string): void {
  const triggers = [...(trigger.closest('[data-faq]')?.querySelectorAll(TRIGGER_SELECTOR) ?? [])];
  const index = triggers.indexOf(trigger);
  const target = {
    ArrowDown: triggers[(index + 1) % triggers.length],
    ArrowUp: triggers[(index - 1 + triggers.length) % triggers.length],
    Home: triggers[0],
    End: triggers[triggers.length - 1],
  }[key];
  (target as HTMLButtonElement | undefined)?.focus();
}

/** Delegación de eventos: la página se reemplaza al navegar con ClientRouter. */
let bound = false;

export function initFaq(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest<HTMLButtonElement>(TRIGGER_SELECTOR);
    if (trigger) toggle(trigger);
  });
  document.addEventListener('keydown', (event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest<HTMLButtonElement>(TRIGGER_SELECTOR);
    if (!trigger || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    moveFocus(trigger, event.key);
  });
}
