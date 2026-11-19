import services from '../../config/services.json';
import {
  computeCls,
  normalizePath,
  rateVital,
  type ShiftEntry,
  shouldSample,
  type VitalName,
} from './rum-core';

/**
 * Web Vitals reales (RUM), ligeros y privados: sin cookies, sin identificadores y sin IP. Mide
 * LCP, INP, CLS, FCP y TTFB con PerformanceObserver y envía una sola vez, al ocultarse la página
 * (fetch keepalive sin credenciales), métricas anónimas (nombre, valor, ruta) al Worker. Solo mide una fracción de las visitas y
 * respeta Do Not Track, Global Privacy Control y el ahorro de datos.
 */

const SAMPLE_RATE = 0.1;
const OBSERVE_OPTIONS = { buffered: true } as const;

interface NavigatorHints {
  connection?: { saveData?: boolean };
  globalPrivacyControl?: boolean;
}

function observe(
  type: string,
  onEntries: (entries: PerformanceEntryList) => void,
  extra = {},
): void {
  try {
    new PerformanceObserver((list) => onEntries(list.getEntries())).observe({
      type,
      ...OBSERVE_OPTIONS,
      ...extra,
    });
  } catch {
    // Tipo de entrada no soportado por este navegador: esa métrica no se mide.
  }
}

/** Activa la medición una sola vez por carga completa del documento. */
export function initRum(): void {
  const api = services.apiBaseUrl;
  const hints = navigator as Navigator & NavigatorHints;
  if (
    !api ||
    !shouldSample({
      rate: SAMPLE_RATE,
      random: Math.random(),
      doNotTrack: navigator.doNotTrack === '1' || hints.globalPrivacyControl === true,
      saveData: hints.connection?.saveData === true,
    })
  ) {
    return;
  }

  const values: Partial<Record<VitalName, number | undefined>> = {};
  const shifts: ShiftEntry[] = [];
  observe('largest-contentful-paint', (entries) => {
    values.LCP = entries.at(-1)?.startTime;
  });
  observe('paint', (entries) => {
    values.FCP = entries.find((entry) => entry.name === 'first-contentful-paint')?.startTime;
  });
  observe('layout-shift', (entries) => {
    for (const entry of entries as unknown as Array<ShiftEntry & { value: number }>)
      shifts.push(entry);
    values.CLS = computeCls(shifts);
  });
  observe(
    'event',
    (entries) => {
      for (const entry of entries as Array<PerformanceEventTiming & { interactionId?: number }>) {
        if ((entry.interactionId ?? 0) > 0) values.INP = Math.max(values.INP ?? 0, entry.duration);
      }
    },
    { durationThreshold: 40 },
  );
  const navigation = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (navigation) values.TTFB = navigation.responseStart;

  let sent = false;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden' || sent) return;
    sent = true;
    const path = normalizePath(location.pathname, import.meta.env.BASE_URL);
    for (const [name, value] of Object.entries(values) as Array<[VitalName, number | undefined]>) {
      if (value === undefined) continue;
      void fetch(`${api}/vitals`, {
        method: 'POST',
        keepalive: true,
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ name, value, rating: rateVital(name, value), path }),
      }).catch(() => undefined);
    }
  });
}
