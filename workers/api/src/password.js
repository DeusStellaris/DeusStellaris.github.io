/**
 * Contraseñas con PBKDF2-HMAC-SHA256 nativo (crypto.subtle), formato: $pbkdf2-sha256$i=N$sal$hash.
 * 100.000 iteraciones: tope de Cloudflare Workers, que mantiene la petición dentro del plan gratis
 * (el hash corre en código nativo, no cuenta como CPU de JavaScript). Nunca se guarda ni se
 * registra una contraseña en claro: solo existe este hash.
 */

export const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const PHC_PATTERN = /^\$pbkdf2-sha256\$i=(\d{5,6})\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;
const encoder = new TextEncoder();

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
 * @param {Uint8Array} salt
 * @param {number} iterations
 * @param {number} bytes
 */
async function derive(password, salt, iterations, bytes) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    bytes * 8,
  );
  return new Uint8Array(bits);
}

/**
 * @param {string} password
 * @returns {Promise<string>} Hash con sal aleatoria propia.
 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS, HASH_BYTES);
  return `$pbkdf2-sha256$i=${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/**
 * Compara en tiempo constante. Un hash mal formado devuelve false, nunca lanza.
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  const match = PHC_PATTERN.exec(stored);
  if (!match) return false;
  const iterations = Number(match[1]);
  if (iterations > PBKDF2_ITERATIONS) return false;
  const expected = fromBase64(/** @type {string} */ (match[3]));
  const actual = await derive(
    password,
    fromBase64(/** @type {string} */ (match[2])),
    iterations,
    expected.length,
  );
  return constantTimeEqual(actual, expected);
}
