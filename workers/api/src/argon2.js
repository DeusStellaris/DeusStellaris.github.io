/**
 * Contraseñas con Argon2id (RFC 9106), en formato PHC: $argon2id$v=19$m=..,t=..,p=..$sal$hash.
 * Parámetros por defecto: recomendación de OWASP (19 MiB, 2 iteraciones, 1 hilo). Nunca se guarda
 * ni se registra una contraseña en claro: solo existe este hash.
 * Implementación: @noble/hashes (MIT), sin dependencias nativas, apta para Workers.
 */

import { argon2idAsync } from '@noble/hashes/argon2.js';

export const ARGON2_DEFAULTS = Object.freeze({ m: 19456, t: 2, p: 1 });
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const PHC_PATTERN =
  /^\$argon2id\$v=19\$m=(\d{1,7}),t=(\d{1,3}),p=(\d{1,2})\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

/** @param {Uint8Array} bytes */
function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, '');
}

/** @param {string} text */
function fromBase64(text) {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

/** @param {Uint8Array} a @param {Uint8Array} b */
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/**
 * @param {string} password
 * @param {{ m: number, t: number, p: number }} [params]
 * @returns {Promise<string>} Hash PHC con sal aleatoria propia.
 */
export async function hashPassword(password, params = ARGON2_DEFAULTS) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await argon2idAsync(password, salt, { ...params, dkLen: HASH_BYTES });
  return `$argon2id$v=19$m=${params.m},t=${params.t},p=${params.p}$${toBase64(salt)}$${toBase64(hash)}`;
}

/**
 * Compara en tiempo constante. Un hash mal formado devuelve false, nunca lanza.
 * @param {string} password
 * @param {string} phc
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, phc) {
  const match = PHC_PATTERN.exec(phc);
  if (!match) return false;
  const [, m, t, p, salt, hash] = match;
  const expected = fromBase64(/** @type {string} */ (hash));
  const actual = await argon2idAsync(password, fromBase64(/** @type {string} */ (salt)), {
    m: Number(m),
    t: Number(t),
    p: Number(p),
    dkLen: expected.length,
  });
  return constantTimeEqual(actual, expected);
}
