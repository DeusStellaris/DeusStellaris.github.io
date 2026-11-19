/**
 * Lógica pura del posicionamiento de tooltips. Sin DOM: se prueba en Node.
 * El tooltip se ancla al borde derecho de su control; si queda fuera del margen se desplaza.
 */

export const TOOLTIP_MARGIN = 12;

/** Desplazamiento horizontal (px) para que el cuadro quede dentro del viewport con el margen dado. */
export function tooltipShift(anchorRight: number, width: number, viewportWidth: number): number {
  const left = anchorRight - width;
  if (left < TOOLTIP_MARGIN) return TOOLTIP_MARGIN - left;
  const overflow = anchorRight - (viewportWidth - TOOLTIP_MARGIN);
  return overflow > 0 ? -overflow : 0;
}

/** Si el tooltip no cabe debajo del control, se muestra arriba. */
export function tooltipFlipsUp(
  anchorBottom: number,
  anchorTop: number,
  height: number,
  viewportHeight: number,
): boolean {
  const gap = 8;
  const fitsBelow = anchorBottom + gap + height <= viewportHeight - TOOLTIP_MARGIN;
  return !fitsBelow && anchorTop - gap - height >= TOOLTIP_MARGIN;
}
