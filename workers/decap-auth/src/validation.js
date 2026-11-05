/**
 * Validación de los parámetros que llegan desde el navegador o desde GitHub.
 * Todo parámetro se trata como no confiable: se valida formato y valores permitidos antes de usarlo.
 */

const STATE_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const CODE_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;
const ALLOWED_SCOPES = new Set(['repo', 'public_repo']);

/** @param {string | null} provider */
export function isGithubProvider(provider) {
  return provider === 'github';
}

/**
 * Alcance OAuth permitido. Ausente = 'repo' (el que usa Decap por defecto).
 * @param {string | null} scope
 * @returns {string | null} Alcance válido, o null si no está permitido.
 */
export function normalizeScope(scope) {
  const value = scope ?? 'repo';
  return ALLOWED_SCOPES.has(value) ? value : null;
}

/** @param {string | null} state */
export function isValidState(state) {
  return typeof state === 'string' && STATE_PATTERN.test(state);
}

/** @param {string | null} code */
export function isValidAuthorizationCode(code) {
  return typeof code === 'string' && CODE_PATTERN.test(code);
}

/**
 * Antigüedad máxima de la transacción OAuth, en segundos. Más allá de esto se rechaza.
 * La cookie también caduca, pero la comprobación explícita no depende del navegador.
 */
export const MAX_TRANSACTION_AGE_SECONDS = 300;

/**
 * @param {unknown} issuedAt
 * @param {number} nowSeconds
 */
export function isTransactionFresh(issuedAt, nowSeconds) {
  if (typeof issuedAt !== 'number' || !Number.isFinite(issuedAt)) return false;
  const age = nowSeconds - issuedAt;
  return age >= 0 && age <= MAX_TRANSACTION_AGE_SECONDS;
}
