/**
 * Estado del consentimiento en el navegador. Lógica pura, sin efectos: se prueba con Node.
 *
 * Reglas:
 *  - Aceptar términos y aceptar la privacidad son registros separados, cada uno con su versión.
 *  - Una aceptación solo se considera REGISTRADA cuando el servidor confirmó el registro
 *    (estado 'registered', con la hora que devuelve el servidor). Si no, queda 'pending'.
 *  - La preferencia de publicidad (cookies no esenciales) es independiente y opcional.
 *  - Un valor almacenado con formato inesperado se descarta: nunca se da por válido.
 */

export const CONSENT_KEY = 'deus:consent';

export type LegalKind = 'terms' | 'privacy';
export type RegistrationStatus = 'registered' | 'pending';

export interface LegalAcceptance {
  version: string;
  status: RegistrationStatus;
  /** Fecha y hora UTC devuelta por el servidor (ISO 8601). Null mientras esté pendiente. */
  acceptedAt: string | null;
}

export interface ConsentRecord {
  version: 1;
  legal: Partial<Record<LegalKind, LegalAcceptance>>;
  ads: { granted: boolean; decidedAt: string } | null;
}

export type DocumentVersions = Record<LegalKind | 'cookies', string>;

const VERSION_PATTERN = /^[0-9a-zA-Z.-]{1,32}$/;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const STATUSES: readonly RegistrationStatus[] = ['registered', 'pending'];

export function emptyRecord(): ConsentRecord {
  return { version: 1, legal: {}, ads: null };
}

function isAcceptance(value: unknown): value is LegalAcceptance {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.version !== 'string' || !VERSION_PATTERN.test(item.version)) return false;
  if (typeof item.status !== 'string' || !STATUSES.includes(item.status as RegistrationStatus))
    return false;
  if (
    item.acceptedAt !== null &&
    (typeof item.acceptedAt !== 'string' || !ISO_PATTERN.test(item.acceptedAt))
  ) {
    return false;
  }
  // Una aceptación registrada siempre tiene la hora del servidor.
  if (item.status === 'registered' && item.acceptedAt === null) return false;
  return true;
}

/**
 * Valida el contenido leído de almacenamiento. Devuelve null si cualquier campo no encaja.
 * @param {unknown} raw
 */
export function parseConsentRecord(raw: unknown): ConsentRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (record.version !== 1) return null;

  const legal: ConsentRecord['legal'] = {};
  if (typeof record.legal !== 'object' || record.legal === null) return null;
  for (const kind of ['terms', 'privacy'] as const) {
    const value = (record.legal as Record<string, unknown>)[kind];
    if (value === undefined) continue;
    if (!isAcceptance(value)) return null;
    legal[kind] = value;
  }

  let ads: ConsentRecord['ads'] = null;
  if (record.ads !== null && record.ads !== undefined) {
    const value = record.ads as Record<string, unknown>;
    if (
      typeof value.granted !== 'boolean' ||
      typeof value.decidedAt !== 'string' ||
      !ISO_PATTERN.test(value.decidedAt)
    ) {
      return null;
    }
    ads = { granted: value.granted, decidedAt: value.decidedAt };
  }

  return { version: 1, legal, ads };
}

/** True si el visitante debe ver el aviso: falta una aceptación vigente o no está registrada en el servidor. */
export function needsBanner(record: ConsentRecord, versions: DocumentVersions): boolean {
  for (const kind of ['terms', 'privacy'] as const) {
    const accepted = record.legal[kind];
    if (!accepted || accepted.version !== versions[kind] || accepted.status !== 'registered')
      return true;
  }
  return false;
}

/** Marca una aceptación como registrada, con la hora que devolvió el servidor. */
export function markRegistered(
  record: ConsentRecord,
  kind: LegalKind,
  version: string,
  acceptedAt: string,
): ConsentRecord {
  return {
    ...record,
    legal: { ...record.legal, [kind]: { version, status: 'registered', acceptedAt } },
  };
}

/** Registra la intención de aceptar sin confirmación del servidor: queda pendiente. */
export function markPending(
  record: ConsentRecord,
  kind: LegalKind,
  version: string,
): ConsentRecord {
  return {
    ...record,
    legal: { ...record.legal, [kind]: { version, status: 'pending', acceptedAt: null } },
  };
}

/** Preferencia de publicidad. Independiente de la aceptación de términos y privacidad. */
export function setAdsDecision(
  record: ConsentRecord,
  granted: boolean,
  nowIso: string,
): ConsentRecord {
  return { ...record, ads: { granted, decidedAt: nowIso } };
}

/** Comprueba que los dos documentos obligatorios están marcados. */
export function requiredChecksOk(termsChecked: boolean, privacyChecked: boolean): boolean {
  return termsChecked === true && privacyChecked === true;
}

/** Preferencia de publicidad concedida (solo si existe una decisión explícita y positiva). */
export function adsGranted(record: ConsentRecord): boolean {
  return record.ads?.granted === true;
}

/** Hora UTC que devuelve el servidor: con Z o +00:00 y hasta 6 decimales (Postgres usa +00:00). */
export function isIsoUtc(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(?:Z|\+00:00)$/.test(value)
  );
}
