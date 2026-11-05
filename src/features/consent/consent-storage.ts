import { CONSENT_KEY, type ConsentRecord, emptyRecord, parseConsentRecord } from './consent-state';

/**
 * Lectura y escritura tolerantes del registro de consentimiento en localStorage.
 * Un valor corrupto se descarta (se trata como sin decisión). Si no se puede escribir, se avisa
 * por el mismo canal de estado: nunca se da por registrado un consentimiento no guardado.
 */

export function loadConsentRecord(): ConsentRecord {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return emptyRecord();
    return parseConsentRecord(JSON.parse(raw)) ?? emptyRecord();
  } catch {
    return emptyRecord();
  }
}

/** @returns true si se pudo guardar en el navegador. */
export function saveConsentRecord(record: ConsentRecord): boolean {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}
