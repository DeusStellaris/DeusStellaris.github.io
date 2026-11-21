/**
 * Cuentas opcionales para respaldar el perfil de DeusDeck en la nube. Apagadas por defecto:
 * sin ACCOUNTS_ENABLED=true y ACCOUNT_TOKEN_SECRET todas las rutas responden 404.
 *
 *   POST /accounts/register  { email, password }   →  201 { registered: true }
 *   POST /accounts/login     { email, password }   →  200 { loggedIn: true, expiresIn } + cookie de sesión
 *   GET  /accounts/backup    (cookie)              →  200 { payload, updatedAt } | 404
 *   PUT  /accounts/backup    (cookie) { payload }  →  200 { saved: true }
 *
 * Privacy by Design:
 *  - La contraseña se guarda solo como hash PBKDF2-SHA256 con sal propia (password.js). Nunca en claro ni en logs.
 *  - El correo se guarda solo como HMAC con un secreto del servidor: no hay lista de correos que filtrar.
 *    Consecuencia: no hay recuperación por correo. Se decide al lanzar la función.
 *  - El acceso usa un token firmado (HMAC) de una hora en una cookie __Host- HttpOnly, Secure y
 *    SameSite=Strict: el JavaScript de la página nunca lo ve. No hay sesiones en el servidor.
 *  - CSRF: SameSite=Strict, lista de orígenes, rechazo de Sec-Fetch-Site cross-site y cuerpo JSON
 *    obligatorio (fuerza preflight CORS en toda escritura).
 *  - Errores genéricos: iniciar sesión no revela si el correo existe y siempre ejecuta un PBKDF2.
 */

import { hashPassword, verifyPassword } from './password.js';
import { canonicalizeOrigin, readConfig } from './config.js';
import { pseudonymize } from './hash.js';
import { errorResponse, jsonResponse } from './http.js';
import {
  consumeRateLimit,
  findAccount,
  getBackup,
  insertAccount,
  putBackup,
  SupabaseError,
} from './supabase.js';
import { readJsonBody, SLUG_PATTERN } from './validation.js';

const TOKEN_TTL_SECONDS = 3600;
export const SESSION_COOKIE = '__Host-deus_session';
const MAX_AUTH_BODY_BYTES = 2048;
const MAX_BACKUP_BYTES = 32_768;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const MAX_FAVORITES = 200;
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;
const LIMITS = {
  registerPerHour: { limit: 5, windowSeconds: 3600 },
  loginIpPerMinute: { limit: 10, windowSeconds: 60 },
  loginAccountPer15Min: { limit: 10, windowSeconds: 900 },
  backupPerMinute: { limit: 30, windowSeconds: 60 },
};
const BACKUP_KEYS = Object.freeze(['favorites', 'theme', 'liteMode', 'pushPreferences']);
const encoder = new TextEncoder();

/** @type {Promise<string> | null} */
let dummyHash = null;

/** @param {unknown} body */
export function parseCredentials(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const { email, password } = /** @type {Record<string, unknown>} */ (body);
  if (typeof email !== 'string' || typeof password !== 'string') return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) return null;
  const normalizedPassword = password.normalize('NFKC');
  const length = [...normalizedPassword].length;
  if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) return null;
  return { email: normalizedEmail, password: normalizedPassword };
}

/** @param {unknown} payload */
export function parseBackupPayload(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null;
  const entries = Object.entries(payload);
  if (!entries.every(([key]) => BACKUP_KEYS.includes(key))) return null;
  const { favorites, theme, liteMode, pushPreferences } = /** @type {Record<string, unknown>} */ (
    payload
  );
  if (favorites !== undefined) {
    const valid =
      Array.isArray(favorites) &&
      favorites.length <= MAX_FAVORITES &&
      favorites.every((slug) => typeof slug === 'string' && SLUG_PATTERN.test(slug));
    if (!valid) return null;
  }
  if (theme !== undefined && theme !== 'light' && theme !== 'dark') return null;
  if (liteMode !== undefined && typeof liteMode !== 'boolean') return null;
  if (
    pushPreferences !== undefined &&
    (typeof pushPreferences !== 'object' ||
      pushPreferences === null ||
      Array.isArray(pushPreferences))
  ) {
    return null;
  }
  return payload;
}

/** @param {Uint8Array | ArrayBuffer} bytes */
function toBase64Url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** @param {string} secret */
function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/**
 * Token firmado: base64url(payload).base64url(HMAC). El payload solo lleva el id y la caducidad.
 * @param {string} secret
 * @param {string} accountId
 * @param {number} nowSeconds
 */
export async function signToken(secret, accountId, nowSeconds = Math.floor(Date.now() / 1000)) {
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ sub: accountId, exp: nowSeconds + TOKEN_TTL_SECONDS })),
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    encoder.encode(payload),
  );
  return `${payload}.${toBase64Url(signature)}`;
}

/**
 * Cookie de sesión. __Host- obliga a Secure, Path=/ y sin Domain: solo la recibe el host de la API.
 * @param {string} token Vacío para borrarla.
 */
export function sessionCookie(token) {
  const maxAge = token === '' ? 0 : TOKEN_TTL_SECONDS;
  return `${SESSION_COOKIE}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

/**
 * Token de la cookie de sesión, o cadena vacía.
 * @param {string | null} header Valor de Cookie.
 */
export function readSessionCookie(header) {
  for (const part of (header ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === SESSION_COOKIE) return value.join('=');
  }
  return '';
}

/**
 * @param {string} secret
 * @param {string} token Token firmado (valor de la cookie).
 * @param {number} nowSeconds
 * @returns {Promise<string | null>} Id de la cuenta o null.
 */
export async function verifyToken(secret, token, nowSeconds = Math.floor(Date.now() / 1000)) {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;

  const expected = toBase64Url(
    await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload)),
  );
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  if (diff !== 0) return null;

  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const valid = typeof decoded.sub === 'string' && Number.isInteger(decoded.exp);
    return valid && decoded.exp > nowSeconds ? decoded.sub : null;
  } catch {
    return null;
  }
}

/**
 * Comprobaciones comunes: función encendida, configuración y origen permitido. El sitio y la API
 * viven en dominios distintos (cross-site), así que registro e inicio de sesión se aceptan con
 * origen de la lista; solo las rutas que usan la cookie de sesión rechazan peticiones cross-site.
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 * @param {boolean} [cookieAuth]
 */
function guard(request, env, cookieAuth = false) {
  const origin = canonicalizeOrigin(request.headers.get('origin'));
  const secret = env.ACCOUNT_TOKEN_SECRET ?? '';
  if (env.ACCOUNTS_ENABLED !== 'true' || secret.length < 32) {
    return { response: errorResponse(404, 'Recurso no encontrado.', origin) };
  }
  const loaded = readConfig(env);
  if (!loaded.ok) {
    console.error('config_missing', loaded.missing.join(','));
    return {
      response: errorResponse(503, 'El servicio no está disponible en este momento.', null),
    };
  }
  if (!origin || !loaded.config.allowedOrigins.includes(origin)) {
    return { response: errorResponse(403, 'Origen no permitido.', null) };
  }
  if (cookieAuth && request.headers.get('sec-fetch-site') === 'cross-site') {
    return { response: errorResponse(403, 'Origen no permitido.', null) };
  }
  return { origin, config: loaded.config, secret };
}

/** @param {unknown} error @param {string | null} origin */
function storageFailure(error, origin) {
  console.error('accounts_storage_error', error instanceof SupabaseError ? error.code : 'unknown');
  return errorResponse(502, 'No se pudo completar la solicitud. Intentalo más tarde.', origin);
}

/** @param {string | null} origin */
function tooMany(origin) {
  return errorResponse(429, 'Demasiadas solicitudes. Esperá un momento.', origin, {
    'Retry-After': '60',
  });
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handleRegister(request, env) {
  const ready = guard(request, env);
  if ('response' in ready) return ready.response;
  const { origin, config } = ready;

  const credentials = parseCredentials(await readJsonBody(request, MAX_AUTH_BODY_BYTES));
  if (!credentials) return errorResponse(400, 'Solicitud no válida.', origin);

  try {
    const ipKey = await pseudonymize(
      config.pepper,
      'ip',
      request.headers.get('cf-connecting-ip') ?? 'unknown',
    );
    if (
      !(await consumeRateLimit(config.supabase, {
        key: `account:register:${ipKey}`,
        ...LIMITS.registerPerHour,
      }))
    ) {
      return tooMany(origin);
    }
    const emailHash = await pseudonymize(config.pepper, 'account-email', credentials.email);
    const passwordHash = await hashPassword(credentials.password);
    await insertAccount(config.supabase, { emailHash, passwordHash });
    return jsonResponse({ registered: true }, 201, origin);
  } catch (error) {
    if (error instanceof SupabaseError && error.code === 'http_409') {
      return errorResponse(409, 'No se pudo crear la cuenta.', origin);
    }
    return storageFailure(error, origin);
  }
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handleLogin(request, env) {
  const ready = guard(request, env);
  if ('response' in ready) return ready.response;
  const { origin, config, secret } = ready;

  const credentials = parseCredentials(await readJsonBody(request, MAX_AUTH_BODY_BYTES));
  if (!credentials) return errorResponse(401, 'Credenciales incorrectas.', origin);

  try {
    const ipKey = await pseudonymize(
      config.pepper,
      'ip',
      request.headers.get('cf-connecting-ip') ?? 'unknown',
    );
    const emailHash = await pseudonymize(config.pepper, 'account-email', credentials.email);
    const withinIp = await consumeRateLimit(config.supabase, {
      key: `account:login:ip:${ipKey}`,
      ...LIMITS.loginIpPerMinute,
    });
    const withinAccount =
      withinIp &&
      (await consumeRateLimit(config.supabase, {
        key: `account:login:email:${emailHash}`,
        ...LIMITS.loginAccountPer15Min,
      }));
    if (!withinIp || !withinAccount) return tooMany(origin);

    const account = await findAccount(config.supabase, emailHash);
    // Con o sin cuenta se ejecuta un PBKDF2: la respuesta no delata si el correo existe.
    dummyHash ??= hashPassword('contraseña-de-relleno');
    const valid = await verifyPassword(
      credentials.password,
      account?.passwordHash ?? (await dummyHash),
    );
    if (!account || !valid) return errorResponse(401, 'Credenciales incorrectas.', origin);

    const token = await signToken(secret, account.id);
    return jsonResponse({ loggedIn: true, expiresIn: TOKEN_TTL_SECONDS }, 200, origin, {
      'Set-Cookie': sessionCookie(token),
    });
  } catch (error) {
    return storageFailure(error, origin);
  }
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handleBackup(request, env) {
  const ready = guard(request, env, true);
  if ('response' in ready) return ready.response;
  const { origin, config, secret } = ready;

  const accountId = await verifyToken(secret, readSessionCookie(request.headers.get('cookie')));
  if (!accountId) return errorResponse(401, 'Sesión no válida.', origin);

  try {
    if (
      !(await consumeRateLimit(config.supabase, {
        key: `account:backup:${accountId}`,
        ...LIMITS.backupPerMinute,
      }))
    ) {
      return tooMany(origin);
    }
    if (request.method === 'GET') {
      const backup = await getBackup(config.supabase, accountId);
      return backup
        ? jsonResponse(backup, 200, origin)
        : errorResponse(404, 'Sin respaldo.', origin);
    }

    const body = /** @type {{ payload?: unknown } | null} */ (
      await readJsonBody(request, MAX_BACKUP_BYTES)
    );
    const payload = parseBackupPayload(body?.payload);
    if (!payload) return errorResponse(400, 'Solicitud no válida.', origin);
    await putBackup(config.supabase, accountId, payload);
    return jsonResponse({ saved: true }, 200, origin);
  } catch (error) {
    return storageFailure(error, origin);
  }
}
