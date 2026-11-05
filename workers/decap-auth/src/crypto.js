/**
 * Primitivas criptográficas (Web Crypto, disponible en Cloudflare Workers y en Node).
 *
 * - Estado OAuth: se guarda en una cookie cifrada y autenticada (AES-256-GCM).
 *   Así el Worker no necesita almacenamiento propio y un estado manipulado se rechaza.
 * - PKCE (RFC 7636): verificador aleatorio y desafío S256.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Datos adicionales autenticados: separan este cifrado de cualquier otro uso de la misma clave. */
const STATE_AAD = encoder.encode('deus-decap-oauth-state-v1');
const IV_BYTES = 12;
const TAG_BITS = 128;

/** @param {Uint8Array} bytes */
export function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** @param {string} value */
export function fromBase64url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** @param {number} byteLength */
export function randomBase64url(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/**
 * Desafío PKCE con método S256: BASE64URL(SHA256(verifier)).
 * @param {string} verifier
 */
export async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return base64url(new Uint8Array(digest));
}

/**
 * Importa la clave AES-256 desde OAUTH_STATE_KEY (32 bytes codificados en base64).
 * Lanza si la clave no tiene la longitud exacta: un error de configuración no debe ignorarse.
 * @param {string | undefined} base64Key
 */
export async function importStateKey(base64Key) {
  if (typeof base64Key !== 'string' || base64Key.length === 0) {
    throw new Error('OAUTH_STATE_KEY no está configurada');
  }
  let raw;
  try {
    raw = Uint8Array.from(atob(base64Key), (char) => char.charCodeAt(0));
  } catch {
    throw new Error('OAUTH_STATE_KEY no es base64 válido');
  }
  if (raw.length !== 32) throw new Error('OAUTH_STATE_KEY debe tener 32 bytes');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/**
 * @param {CryptoKey} key
 * @param {Record<string, unknown>} payload
 * @returns {Promise<string>} Token opaco apto para una cookie.
 */
export async function sealState(key, payload) {
  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(iv);
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: STATE_AAD, tagLength: TAG_BITS },
    key,
    plaintext,
  );
  const sealed = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  sealed.set(iv, 0);
  sealed.set(new Uint8Array(ciphertext), IV_BYTES);
  return base64url(sealed);
}

/**
 * Abre el token. Devuelve null ante cualquier fallo (formato, etiqueta GCM, JSON), sin detallar la causa.
 * @param {CryptoKey} key
 * @param {string} token
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function openState(key, token) {
  try {
    const bytes = fromBase64url(token);
    if (bytes.length <= IV_BYTES + TAG_BITS / 8) return null;
    const iv = bytes.slice(0, IV_BYTES);
    const ciphertext = bytes.slice(IV_BYTES);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: STATE_AAD, tagLength: TAG_BITS },
      key,
      ciphertext,
    );
    const parsed = JSON.parse(decoder.decode(plaintext));
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Comparación en tiempo constante para cadenas de longitud conocida.
 * @param {string} a
 * @param {string} b
 */
export function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}
