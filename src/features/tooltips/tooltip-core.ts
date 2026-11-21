/**
 * Lógica pura del posicionamiento de tooltips. Sin DOM: se prueba en Node.
 * El cuadro se centra bajo su control, se mantiene dentro del viewport con margen y pasa arriba
 * si no cabe debajo.
 */

export const TOOLTIP_MARGIN = 12;
const GAP = 8;

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Placement {
  left: number;
  top: number;
}

/** Coordenadas (fixed) del tooltip para un control, un tamaño y un viewport dados. */
export function tooltipPlacement(
  anchor: Box,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): Placement {
  const centered = (anchor.left + anchor.right) / 2 - size.width / 2;
  const maxLeft = viewport.width - TOOLTIP_MARGIN - size.width;
  const left = Math.max(TOOLTIP_MARGIN, Math.min(centered, maxLeft));

  const fitsBelow = anchor.bottom + GAP + size.height <= viewport.height - TOOLTIP_MARGIN;
  const fitsAbove = anchor.top - GAP - size.height >= TOOLTIP_MARGIN;
  const top = fitsBelow || !fitsAbove ? anchor.bottom + GAP : anchor.top - GAP - size.height;
  return { left, top };
}
