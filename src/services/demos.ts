import demosConfig from '../config/demos.json';
import type { Locale } from '../i18n';

/**
 * Demos jugables publicadas. Única capa que lee demos.json: descarta las entradas mal formadas.
 * Cada demo vive en public/demos/<slug>/index.html y se carga aislada en un iframe.
 */

export interface DemoTouchControl {
  label: string;
  key: string;
}

export interface Demo {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  /** Ruta de la portada dentro de public/ (sin barra inicial). */
  cover: string;
  sizeMb: number;
  controls: { keyboard: boolean; mouse: boolean; touch: boolean };
  touchControls: DemoTouchControl[];
}

const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const KEY_PATTERN = /^[A-Za-z0-9 ]{1,20}$/;

const isLocalized = (value: unknown): value is Record<Locale, string> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Record<string, unknown>).es === 'string' &&
  typeof (value as Record<string, unknown>).en === 'string';

function parseDemo(raw: unknown): Demo | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.slug !== 'string' || !SLUG_PATTERN.test(item.slug)) return null;
  if (!isLocalized(item.title) || !isLocalized(item.description)) return null;
  if (typeof item.cover !== 'string' || item.cover.startsWith('/') || item.cover.includes('..')) {
    return null;
  }
  if (typeof item.sizeMb !== 'number' || !(item.sizeMb > 0)) return null;

  const controls = (item.controls ?? {}) as Record<string, unknown>;
  const touchControls = Array.isArray(item.touchControls)
    ? item.touchControls.filter(
        (control): control is DemoTouchControl =>
          typeof control?.label === 'string' &&
          typeof control?.key === 'string' &&
          KEY_PATTERN.test(control.key),
      )
    : [];
  return {
    slug: item.slug,
    title: item.title,
    description: item.description,
    cover: item.cover,
    sizeMb: item.sizeMb,
    controls: {
      keyboard: controls.keyboard === true,
      mouse: controls.mouse === true,
      touch: controls.touch === true,
    },
    touchControls,
  };
}

export function listDemos(): Demo[] {
  return demosConfig.demos.map(parseDemo).filter((demo): demo is Demo => demo !== null);
}
