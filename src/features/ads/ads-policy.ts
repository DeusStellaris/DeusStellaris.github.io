/**
 * Decisión de publicidad. Lógica pura: se prueba con Node y se usa en el navegador y en el build.
 *
 * Principios:
 *  - Con el interruptor general apagado, no se renderiza ningún espacio ni se carga nada.
 *  - El script de AdSense solo se carga si: el interruptor está encendido, hay un identificador
 *    de editor con formato válido y el visitante concedió la preferencia de publicidad.
 *  - Sin identificador válido nunca se carga el script: no se inventan identificadores.
 */

export interface AdsInput {
  /** Interruptor general (src/config/ads.json → enabled). */
  enabled: boolean;
  /** Identificador de editor de AdSense (ca-pub-…), o null. */
  publisherId: string | null;
  /** True solo con una decisión explícita y positiva del visitante. */
  visitorGranted: boolean;
}

export interface AdsDecision {
  /** Reservar y mostrar los espacios publicitarios (con su marcador de reserva). */
  renderSlots: boolean;
  /** Cargar el script de AdSense. */
  loadScript: boolean;
}

const PUBLISHER_PATTERN = /^ca-pub-\d{16}$/;

export function isValidPublisherId(value: string | null): value is string {
  return typeof value === 'string' && PUBLISHER_PATTERN.test(value);
}

export function adsDecision(input: AdsInput): AdsDecision {
  if (!input.enabled) return { renderSlots: false, loadScript: false };
  const loadScript = isValidPublisherId(input.publisherId) && input.visitorGranted;
  return { renderSlots: true, loadScript };
}
