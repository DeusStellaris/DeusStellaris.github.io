import { supabaseState } from '../../lib/supabase-client';
import { getVisitorId } from '../likes/visitor';
import {
  adsGranted,
  type ConsentRecord,
  type DocumentVersions,
  type LegalKind,
  markPending,
  markRegistered,
  needsBanner,
  requiredChecksOk,
  setAdsDecision,
} from './consent-state';
import { loadConsentRecord, saveConsentRecord } from './consent-storage';

/**
 * Consentimiento en el navegador: aviso, registro en el servidor y preferencias de cookies.
 *
 * - La aceptación de términos y privacidad solo se marca como registrada si el servidor
 *   devuelve su confirmación con hora UTC. Sin servidor, queda pendiente y se dice así.
 * - La preferencia de publicidad es independiente y se guarda también en el registro del servidor.
 * - Los mensajes llegan por data-* para que el script no contenga texto traducido.
 */

const BANNER_SELECTOR = '[data-consent-banner]';
const MANAGER_SELECTOR = '[data-consent-manager]';
const DISMISS_KEY = 'deus:consent-dismissed';
const API_TIMEOUT_MS = 8_000;

interface Messages {
  required: string;
  registered: string;
  serverPending: string;
  serverUnavailable: string;
  localSaved: string;
}

interface Context {
  apiBaseUrl: string;
  versions: DocumentVersions;
  locale: string;
}

function readMessages(root: HTMLElement): Messages {
  const d = root.dataset;
  return {
    required: d.msgRequired ?? '',
    registered: d.msgRegistered ?? '',
    serverPending: d.msgServerPending ?? '',
    serverUnavailable: d.msgServerUnavailable ?? '',
    localSaved: d.msgLocalSaved ?? '',
  };
}

function readContext(root: HTMLElement): Context {
  const versions = JSON.parse(root.dataset.versions ?? '{}') as DocumentVersions;
  return {
    apiBaseUrl: root.dataset.api ?? '',
    versions,
    locale: root.dataset.locale ?? 'es',
  };
}

function isIsoUtc(value: unknown): value is string {
  return (
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value)
  );
}

/**
 * Envía una decisión al servidor. Devuelve la hora UTC del servidor si la confirmó, o null.
 * Nunca usa la hora del cliente como prueba de registro.
 */
async function registerOnServer(
  apiBaseUrl: string,
  body: {
    type: LegalKind | 'cookies_ads';
    granted: boolean;
    documentVersion: string;
    locale: string;
  },
): Promise<string | null> {
  if (apiBaseUrl === '' || !supabaseState().configured) return null;
  try {
    const response = await fetch(`${apiBaseUrl}/consent`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...body, visitorId: getVisitorId() }),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const json: unknown = await response.json();
    const acceptedAt = (json as { acceptedAt?: unknown } | null)?.acceptedAt;
    return isIsoUtc(acceptedAt) ? acceptedAt : null;
  } catch {
    return null;
  }
}

function setStatus(root: HTMLElement, text: string): void {
  const status = root.querySelector<HTMLElement>('[data-consent-status]');
  if (status) status.textContent = text;
}

function setError(root: HTMLElement, text: string): void {
  const error = root.querySelector<HTMLElement>('[data-consent-error]');
  if (!error) return;
  error.textContent = text;
  error.hidden = text === '';
}

function showBanner(root: HTMLElement, visible: boolean): void {
  root.hidden = !visible;
}

async function submitBanner(root: HTMLElement, event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const messages = readMessages(root);
  const context = readContext(root);
  const terms = root.querySelector<HTMLInputElement>('[data-consent-terms]');
  const privacy = root.querySelector<HTMLInputElement>('[data-consent-privacy]');
  const ads = root.querySelector<HTMLInputElement>('[data-consent-ads]');
  if (!terms || !privacy) return;

  if (!requiredChecksOk(terms.checked, privacy.checked)) {
    setError(root, messages.required);
    (terms.checked ? privacy : terms).focus();
    return;
  }
  setError(root, '');

  let record: ConsentRecord = loadConsentRecord();
  const adsChoice = ads ? ads.checked : null;
  if (adsChoice !== null) record = setAdsDecision(record, adsChoice, new Date().toISOString());

  const kinds: LegalKind[] = ['terms', 'privacy'];
  const serverTimes = await Promise.all(
    kinds.map((kind) =>
      registerOnServer(context.apiBaseUrl, {
        type: kind,
        granted: true,
        documentVersion: context.versions[kind],
        locale: context.locale,
      }),
    ),
  );

  kinds.forEach((kind, index) => {
    const acceptedAt = serverTimes[index] ?? null;
    record = acceptedAt
      ? markRegistered(record, kind, context.versions[kind], acceptedAt)
      : markPending(record, kind, context.versions[kind]);
  });

  if (adsChoice !== null && context.apiBaseUrl !== '') {
    void registerOnServer(context.apiBaseUrl, {
      type: 'cookies_ads',
      granted: adsChoice,
      documentVersion: context.versions.cookies,
      locale: context.locale,
    });
  }

  saveConsentRecord(record);

  const allRegistered = serverTimes.every((time) => time !== null);
  if (allRegistered) {
    setStatus(root, messages.registered);
    showBanner(root, needsBanner(record, context.versions));
  } else {
    setStatus(
      root,
      context.apiBaseUrl === '' || !supabaseState().configured
        ? messages.serverUnavailable
        : messages.serverPending,
    );
  }
  window.dispatchEvent(new CustomEvent('deus:consent-changed'));
}

function laterBanner(root: HTMLElement): void {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, 'yes');
  } catch {
    // Sin sessionStorage, el aviso reaparece en la siguiente página. No es crítico.
  }
  showBanner(root, false);
}

function initBanner(root: HTMLElement): void {
  if (root.dataset.consentReady === 'true') return;
  root.dataset.consentReady = 'true';

  // El envío se escucha en el propio formulario: así se ejecuta antes que el ClientRouter de Astro,
  // que intercepta los envíos no cancelados en document y navegaría (reemplazando el aviso).
  const form = root.querySelector<HTMLFormElement>('[data-consent-form]');
  form?.addEventListener('submit', (event) => void submitBanner(root, event));
  const context = readContext(root);
  const record = loadConsentRecord();
  const dismissed = (() => {
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === 'yes';
    } catch {
      return false;
    }
  })();

  const ads = root.querySelector<HTMLInputElement>('[data-consent-ads]');
  if (ads) ads.checked = adsGranted(record);
  showBanner(root, !dismissed && needsBanner(record, context.versions));
}

function initManager(root: HTMLElement): void {
  if (root.dataset.consentReady === 'true') return;
  root.dataset.consentReady = 'true';
  const context = readContext(root);
  const messages = readMessages(root);
  const toggle = root.querySelector<HTMLInputElement>('[data-consent-manager-ads]');
  if (toggle) toggle.checked = adsGranted(loadConsentRecord());

  toggle?.addEventListener('change', () => {
    const granted = toggle.checked;
    const record = setAdsDecision(loadConsentRecord(), granted, new Date().toISOString());
    saveConsentRecord(record);
    window.dispatchEvent(new CustomEvent('deus:consent-changed'));
    void registerOnServer(context.apiBaseUrl, {
      type: 'cookies_ads',
      granted,
      documentVersion: context.versions.cookies,
      locale: context.locale,
    }).then((acceptedAt) => {
      setStatus(root, acceptedAt ? messages.registered : messages.localSaved);
    });
  });

  root.querySelector<HTMLButtonElement>('[data-consent-reopen]')?.addEventListener('click', () => {
    try {
      window.sessionStorage.removeItem(DISMISS_KEY);
    } catch {
      // Sin sessionStorage no hay nada que limpiar.
    }
    const banner = document.querySelector<HTMLElement>(BANNER_SELECTOR);
    if (banner) {
      initBanner(banner);
      showBanner(banner, true);
      banner.querySelector<HTMLInputElement>('[data-consent-terms]')?.focus();
    }
  });
}

let listenersBound = false;

function bindOnce(): void {
  if (listenersBound) return;
  listenersBound = true;
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const root = event.target.closest<HTMLElement>(BANNER_SELECTOR);
    if (root && event.target.closest('[data-consent-later],[data-consent-close]'))
      laterBanner(root);
  });
}

/** Activa el aviso y el gestor de preferencias de la página actual. Idempotente. */
export function initConsent(): void {
  bindOnce();
  for (const root of document.querySelectorAll<HTMLElement>(BANNER_SELECTOR)) initBanner(root);
  for (const root of document.querySelectorAll<HTMLElement>(MANAGER_SELECTOR)) initManager(root);
}
