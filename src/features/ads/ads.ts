import ads from '../../config/ads.json';
import { adsGranted } from '../consent/consent-state';
import { loadConsentRecord } from '../consent/consent-storage';
import { adsDecision, isValidPublisherId } from './ads-policy';

/**
 * Carga de AdSense. El script solo se inserta cuando la decisión lo permite (interruptor,
 * identificador válido y preferencia de publicidad concedida). Se inserta una sola vez.
 *
 * Si el visitante retira la preferencia, el script ya cargado no puede descargarse: la página
 * lo indica y se aplica en la siguiente carga completa.
 */

const ADSENSE_SCRIPT = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptRequested = false;

function pushUnits(): void {
  for (const unit of document.querySelectorAll<HTMLElement>(
    'ins.adsbygoogle:not([data-ad-pushed])',
  )) {
    unit.dataset.adPushed = 'true';
    window.adsbygoogle = window.adsbygoogle ?? [];
    window.adsbygoogle.push({});
  }
}

function ensureScript(publisherId: string): void {
  if (scriptRequested) {
    pushUnits();
    return;
  }
  scriptRequested = true;
  const script = document.createElement('script');
  script.src = `${ADSENSE_SCRIPT}?client=${encodeURIComponent(publisherId)}`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.addEventListener('load', pushUnits);
  document.head.append(script);
}

/** Aplica la decisión de publicidad a los espacios de la página. Idempotente. */
export function initAds(): void {
  const slots = document.querySelectorAll<HTMLElement>('[data-ad-slot]');
  if (slots.length === 0) return;

  const publisherId = ads.publisherId;
  const decision = adsDecision({
    enabled: ads.enabled === true,
    publisherId,
    visitorGranted: adsGranted(loadConsentRecord()),
  });

  for (const slot of slots) {
    const waiting = slot.querySelector<HTMLElement>('[data-ad-waiting]');
    if (waiting) waiting.hidden = decision.loadScript;
  }

  if (decision.loadScript && isValidPublisherId(publisherId)) {
    ensureScript(publisherId);
  }
}
