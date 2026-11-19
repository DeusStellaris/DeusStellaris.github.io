/**
 * Lógica pura de la medición de Web Vitals reales (RUM). Sin DOM: se prueba en Node.
 * Los umbrales son los publicados por web.dev (bueno / necesita mejorar / malo).
 */

export type VitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
export type VitalRating = 'good' | 'needs-improvement' | 'poor';

const THRESHOLDS: Record<VitalName, readonly [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

export function rateVital(name: VitalName, value: number): VitalRating {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return 'good';
  return value <= poor ? 'needs-improvement' : 'poor';
}

/** Ruta sin la base del sitio ni caracteres fuera del conjunto que acepta la API. */
export function normalizePath(pathname: string, base: string): string {
  const root = base.endsWith('/') ? base : `${base}/`;
  const local = pathname.startsWith(root) ? `/${pathname.slice(root.length)}` : pathname;
  return local.replace(/[^A-Za-z0-9/_.-]/g, '').slice(0, 200) || '/';
}

export interface ShiftEntry {
  value: number;
  startTime: number;
  hadRecentInput: boolean;
}

/** CLS por ventanas de sesión (máx. 5 s de ventana y 1 s entre cambios); devuelve el peor puntaje. */
export function computeCls(shifts: readonly ShiftEntry[]): number {
  let worst = 0;
  let windowValue = 0;
  let windowStart = 0;
  let last = 0;
  for (const shift of shifts) {
    if (shift.hadRecentInput) continue;
    const continues =
      windowValue > 0 && shift.startTime - last < 1000 && shift.startTime - windowStart < 5000;
    if (!continues) {
      windowValue = 0;
      windowStart = shift.startTime;
    }
    windowValue += shift.value;
    last = shift.startTime;
    worst = Math.max(worst, windowValue);
  }
  return worst;
}

/** Decide si esta visita se mide: muestreo, sin Do Not Track / Global Privacy Control ni ahorro de datos. */
export function shouldSample(options: {
  rate: number;
  random: number;
  doNotTrack: boolean;
  saveData: boolean;
}): boolean {
  return !options.doNotTrack && !options.saveData && options.random < options.rate;
}
