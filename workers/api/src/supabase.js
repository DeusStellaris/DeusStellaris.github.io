/**
 * Cliente REST de Supabase para el Worker. Usa la clave service_role, que solo existe como
 * secreto del Worker. Nunca se devuelve al navegador ni aparece en una respuesta.
 *
 * Las operaciones usan funciones SQL con nombre fijo (ver supabase/migrations). El Worker
 * nunca construye SQL ni acepta nombres de tabla o de función del cliente.
 */

const REQUEST_TIMEOUT_MS = 8_000;

export class SupabaseError extends Error {
  /** @param {string} code */
  constructor(code) {
    super(code);
    this.name = 'SupabaseError';
    this.code = code;
  }
}

/**
 * @param {{ url: string, serviceKey: string }} config
 * @param {string} path Ruta relativa a /rest/v1, sin barra inicial.
 * @param {RequestInit & { prefer?: string }} [init]
 */
async function request(config, path, init = {}) {
  const { prefer, ...rest } = init;
  let response;
  try {
    response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...rest,
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new SupabaseError('network');
  }
  if (!response.ok) throw new SupabaseError(`http_${response.status}`);
  return response;
}

/**
 * Registra un like. ON CONFLICT DO NOTHING: un segundo like del mismo visitante no duplica.
 * @param {{ url: string, serviceKey: string }} config
 * @param {{ slug: string, visitorHash: string }} row
 */
export async function insertLike(config, { slug, visitorHash }) {
  await request(config, 'likes?on_conflict=project_slug,visitor_hash', {
    method: 'POST',
    body: JSON.stringify([{ project_slug: slug, visitor_hash: visitorHash }]),
    prefer: 'resolution=ignore-duplicates,return=minimal',
  });
}

/**
 * Retira un like del visitante.
 * @param {{ url: string, serviceKey: string }} config
 * @param {{ slug: string, visitorHash: string }} row
 */
export async function deleteLike(config, { slug, visitorHash }) {
  const query = new URLSearchParams({
    project_slug: `eq.${slug}`,
    visitor_hash: `eq.${visitorHash}`,
  });
  await request(config, `likes?${query.toString()}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
}

/**
 * Número total de likes de un proyecto (función SQL get_like_count).
 * @param {{ url: string, serviceKey: string }} config
 * @param {string} slug
 * @returns {Promise<number>}
 */
export async function countLikes(config, slug) {
  const response = await request(config, 'rpc/get_like_count', {
    method: 'POST',
    body: JSON.stringify({ p_slug: slug }),
  });
  const value = await response.json();
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new SupabaseError('count_shape');
  }
  return value;
}

/**
 * Consume una unidad del límite de frecuencia (función SQL consume_rate_limit, atómica).
 * @param {{ url: string, serviceKey: string }} config
 * @param {{ key: string, limit: number, windowSeconds: number }} params
 * @returns {Promise<boolean>} true si la petición está dentro del límite.
 */
export async function consumeRateLimit(config, { key, limit, windowSeconds }) {
  const response = await request(config, 'rpc/consume_rate_limit', {
    method: 'POST',
    body: JSON.stringify({ p_key: key, p_limit: limit, p_window_seconds: windowSeconds }),
  });
  const allowed = await response.json();
  if (typeof allowed !== 'boolean') throw new SupabaseError('rate_limit_shape');
  return allowed;
}

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|\+00:00)$/;

/**
 * Inserta un registro de consentimiento y devuelve la hora UTC que asigna la base de datos.
 * Si la respuesta no trae una hora con el formato esperado, falla: nunca se inventa una hora.
 * @param {{ url: string, serviceKey: string }} config
 * @param {{ type: string, granted: boolean, documentVersion: string, locale: string, sessionHash: string }} row
 * @returns {Promise<string>}
 */
export async function insertConsent(config, row) {
  const response = await request(config, 'legal_consents', {
    method: 'POST',
    body: JSON.stringify([
      {
        consent_type: row.type,
        granted: row.granted,
        document_version: row.documentVersion,
        locale: row.locale,
        session_hash: row.sessionHash,
      },
    ]),
    prefer: 'return=representation',
  });
  const rows = await response.json();
  const acceptedAt = Array.isArray(rows) ? rows[0]?.accepted_at : undefined;
  if (typeof acceptedAt !== 'string' || !ISO_UTC.test(acceptedAt)) {
    throw new SupabaseError('consent_shape');
  }
  return acceptedAt;
}

/**
 * Crea o actualiza una suscripción push (una fila por endpoint). Las preferencias se reemplazan.
 * @param {{ url: string, serviceKey: string }} config
 * @param {{ endpointHash: string, endpoint: string, p256dh: string, auth: string, mode: string, categories: string[], projects: string[], locale: string }} row
 */
export async function upsertPushSubscription(config, row) {
  await request(config, 'push_subscriptions?on_conflict=endpoint_hash', {
    method: 'POST',
    body: JSON.stringify([
      {
        endpoint_hash: row.endpointHash,
        endpoint: row.endpoint,
        p256dh: row.p256dh,
        auth: row.auth,
        mode: row.mode,
        categories: row.categories,
        projects: row.projects,
        locale: row.locale,
      },
    ]),
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

/**
 * Borra la suscripción push de un endpoint.
 * @param {{ url: string, serviceKey: string }} config
 * @param {string} endpointHash
 */
export async function deletePushSubscription(config, endpointHash) {
  const query = new URLSearchParams({ endpoint_hash: `eq.${endpointHash}` });
  await request(config, `push_subscriptions?${query.toString()}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
}

/**
 * Reseñas publicadas de una demo, más recientes primero. Nunca devuelve el hash del visitante.
 * @param {{ url: string, serviceKey: string }} config
 * @param {string} slug
 * @param {number} limit
 * @returns {Promise<Array<{ rating: number, comment: string, locale: string, createdAt: string }>>}
 */
export async function listReviews(config, slug, limit) {
  const query = new URLSearchParams({
    demo_slug: `eq.${slug}`,
    status: 'eq.published',
    select: 'rating,comment,locale,created_at',
    order: 'created_at.desc',
    limit: String(limit),
  });
  const rows = await (await request(config, `reviews?${query.toString()}`)).json();
  if (!Array.isArray(rows)) throw new SupabaseError('reviews_shape');
  return rows.map((row) => ({
    rating: row.rating,
    comment: row.comment,
    locale: row.locale,
    createdAt: row.created_at,
  }));
}

/**
 * Promedio y cantidad de reseñas publicadas (función SQL review_stats).
 * @param {{ url: string, serviceKey: string }} config
 * @param {string} slug
 * @returns {Promise<{ count: number, average: number | null }>}
 */
export async function reviewStats(config, slug) {
  const response = await request(config, 'rpc/review_stats', {
    method: 'POST',
    body: JSON.stringify({ p_slug: slug }),
  });
  const row = (await response.json())?.[0];
  if (!row || !Number.isInteger(row.review_count)) throw new SupabaseError('stats_shape');
  return { count: row.review_count, average: row.average_rating ?? null };
}

/**
 * Crea o actualiza la reseña del visitante (una por demo).
 * @param {{ url: string, serviceKey: string }} config
 * @param {{ slug: string, visitorHash: string, rating: number, comment: string, locale: string }} row
 */
export async function upsertReview(config, row) {
  await request(config, 'reviews?on_conflict=demo_slug,visitor_hash', {
    method: 'POST',
    body: JSON.stringify([
      {
        demo_slug: row.slug,
        visitor_hash: row.visitorHash,
        rating: row.rating,
        comment: row.comment,
        locale: row.locale,
      },
    ]),
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

/**
 * Crea una cuenta. Un correo repetido falla con http_409 (restricción única).
 * @param {{ url: string, serviceKey: string }} config
 * @param {{ emailHash: string, passwordHash: string }} row
 * @returns {Promise<string>} Id de la cuenta.
 */
export async function insertAccount(config, { emailHash, passwordHash }) {
  const response = await request(config, 'accounts', {
    method: 'POST',
    body: JSON.stringify([{ email_hash: emailHash, password_hash: passwordHash }]),
    prefer: 'return=representation',
  });
  const id = (await response.json())?.[0]?.id;
  if (typeof id !== 'string') throw new SupabaseError('account_shape');
  return id;
}

/**
 * @param {{ url: string, serviceKey: string }} config
 * @param {string} emailHash
 * @returns {Promise<{ id: string, passwordHash: string } | null>}
 */
export async function findAccount(config, emailHash) {
  const query = new URLSearchParams({
    email_hash: `eq.${emailHash}`,
    select: 'id,password_hash',
    limit: '1',
  });
  const row = (await (await request(config, `accounts?${query.toString()}`)).json())?.[0];
  return row ? { id: row.id, passwordHash: row.password_hash } : null;
}

/**
 * @param {{ url: string, serviceKey: string }} config
 * @param {string} accountId
 * @returns {Promise<{ payload: unknown, updatedAt: string } | null>}
 */
export async function getBackup(config, accountId) {
  const query = new URLSearchParams({
    account_id: `eq.${accountId}`,
    select: 'payload,updated_at',
    limit: '1',
  });
  const row = (await (await request(config, `profile_backups?${query.toString()}`)).json())?.[0];
  return row ? { payload: row.payload, updatedAt: row.updated_at } : null;
}

/**
 * @param {{ url: string, serviceKey: string }} config
 * @param {string} accountId
 * @param {object} payload
 */
export async function putBackup(config, accountId, payload) {
  await request(config, 'profile_backups?on_conflict=account_id', {
    method: 'POST',
    body: JSON.stringify([{ account_id: accountId, payload }]),
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}
