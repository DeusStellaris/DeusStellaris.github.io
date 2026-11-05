/**
 * Identificadores pseudónimos. HMAC-SHA256 con un secreto del servidor (pepper): sin el secreto
 * no se pueden revertir ni recalcular a partir de una IP o de un identificador de visitante.
 */

const encoder = new TextEncoder();

/** @param {ArrayBuffer} buffer */
function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {string} pepper Secreto de servidor (VISITOR_HASH_PEPPER). Debe tener al menos 32 caracteres.
 * @param {string} scope Prefijo que separa los dominios: 'ip' o 'visitor'.
 * @param {string} value
 * @returns {Promise<string>} 64 caracteres hexadecimales.
 */
export async function pseudonymize(pepper, scope, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${scope}|${value}`));
  return toHex(signature);
}
