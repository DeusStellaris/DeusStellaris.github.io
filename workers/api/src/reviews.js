/**
 * Reseñas reales de las demos jugables.
 *
 *   GET  /reviews?slug=<demo>  →  200 { slug, count, average, reviews: [{ rating, comment, locale, createdAt }] }
 *   POST /reviews  { slug, visitorId, rating (1-5), comment (opcional, hasta 500), locale }  →  200 { slug, saved: true }
 *
 * Zero Fake Reviews: no existe ninguna reseña sembrada ni generada. Cada visitante (pseudónimo HMAC)
 * tiene una sola reseña por demo; enviar otra la reemplaza. Defensas: origen permitido, demo publicada,
 * frecuencia por IP y por visitante, y un comentario saneado en el servidor (sin etiquetas, sin
 * caracteres de control ni de dirección de texto). El navegador además lo pinta siempre como texto.
 */

import { publishedDemoSlugs } from './catalog.js';
import { canonicalizeOrigin, readConfig } from './config.js';
import { pseudonymize } from './hash.js';
import { errorResponse, jsonResponse } from './http.js';
import {
  consumeRateLimit,
  listReviews,
  reviewStats,
  SupabaseError,
  upsertReview,
} from './supabase.js';
import { readJsonBody, SLUG_PATTERN, UUID_V4_PATTERN } from './validation.js';

export const MAX_COMMENT_LENGTH = 500;
const MAX_RAW_COMMENT_LENGTH = 2000;
const MAX_REVIEW_BODY_BYTES = 4096;
const LIST_LIMIT = 20;
const LOCALES = Object.freeze(['es', 'en']);
const LIMITS = {
  ipPerMinute: { limit: 20, windowSeconds: 60 },
  visitorPerDay: { limit: 10, windowSeconds: 86_400 },
  readPerMinute: { limit: 120, windowSeconds: 60 },
};

// biome-ignore lint/suspicious/noControlCharactersInRegex: se eliminan a propósito
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g;

/**
 * Deja el comentario como texto plano: sin etiquetas HTML, sin caracteres de control y con los
 * espacios normalizados.
 * @param {string} raw
 * @returns {string}
 */
export function sanitizeComment(raw) {
  return raw
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Valida el cuerpo de una reseña. Devuelve el objeto normalizado o null.
 * @param {unknown} body
 */
export function parseReviewBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const { slug, visitorId, rating, comment, locale } = /** @type {Record<string, unknown>} */ (
    body
  );
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) return null;
  if (typeof visitorId !== 'string' || !UUID_V4_PATTERN.test(visitorId)) return null;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }
  if (typeof locale !== 'string' || !LOCALES.includes(locale)) return null;
  if (comment !== undefined && typeof comment !== 'string') return null;
  if (typeof comment === 'string' && comment.length > MAX_RAW_COMMENT_LENGTH) return null;

  const clean = sanitizeComment(comment ?? '');
  if ([...clean].length > MAX_COMMENT_LENGTH) return null;
  return { slug, visitorId, rating, comment: clean, locale };
}

/**
 * Comprobaciones comunes: configuración, origen y demo publicada.
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 * @param {string} slug
 */
async function authorize(request, env, slug) {
  const origin = canonicalizeOrigin(request.headers.get('origin'));
  const loaded = readConfig(env);
  if (!loaded.ok || !loaded.config.demosIndexUrl) {
    console.error('config_missing', loaded.ok ? 'DEMOS_INDEX_URL' : loaded.missing.join(','));
    return {
      response: errorResponse(503, 'El servicio no está disponible en este momento.', null),
    };
  }
  const { config } = loaded;
  if (!origin || !config.allowedOrigins.includes(origin)) {
    return { response: errorResponse(403, 'Origen no permitido.', null) };
  }
  try {
    const slugs = await publishedDemoSlugs(config.demosIndexUrl);
    if (!slugs.has(slug)) return { response: errorResponse(404, 'Demo no encontrada.', origin) };
  } catch {
    console.error('catalog_unavailable');
    return {
      response: errorResponse(503, 'El servicio no está disponible en este momento.', origin),
    };
  }
  return { origin, config };
}

/** @param {unknown} error @param {string | null} origin */
function storageFailure(error, origin) {
  console.error('reviews_storage_error', error instanceof SupabaseError ? error.code : 'unknown');
  return errorResponse(502, 'No se pudo completar la solicitud. Intentalo más tarde.', origin);
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handleReviewsRead(request, env) {
  const slug = new URL(request.url).searchParams.get('slug') ?? '';
  if (!SLUG_PATTERN.test(slug)) {
    return errorResponse(
      400,
      'Solicitud no válida.',
      canonicalizeOrigin(request.headers.get('origin')),
    );
  }
  const ready = await authorize(request, env, slug);
  if ('response' in ready) return ready.response;
  const { origin, config } = ready;

  try {
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    const ipKey = await pseudonymize(config.pepper, 'ip', ip);
    const allowed = await consumeRateLimit(config.supabase, {
      key: `reviews:read:${ipKey}`,
      ...LIMITS.readPerMinute,
    });
    if (!allowed) {
      return errorResponse(429, 'Demasiadas solicitudes. Esperá un momento.', origin, {
        'Retry-After': '60',
      });
    }
    const [stats, reviews] = await Promise.all([
      reviewStats(config.supabase, slug),
      listReviews(config.supabase, slug, LIST_LIMIT),
    ]);
    return jsonResponse({ slug, count: stats.count, average: stats.average, reviews }, 200, origin);
  } catch (error) {
    return storageFailure(error, origin);
  }
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handleReviewsWrite(request, env) {
  const parsed = parseReviewBody(await readJsonBody(request, MAX_REVIEW_BODY_BYTES));
  const origin = canonicalizeOrigin(request.headers.get('origin'));
  if (!parsed) return errorResponse(400, 'Solicitud no válida.', origin);

  const ready = await authorize(request, env, parsed.slug);
  if ('response' in ready) return ready.response;
  const { config } = ready;

  try {
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    const ipKey = await pseudonymize(config.pepper, 'ip', ip);
    const visitorHash = await pseudonymize(config.pepper, 'review-visitor', parsed.visitorId);
    const withinIp = await consumeRateLimit(config.supabase, {
      key: `reviews:ip:${ipKey}`,
      ...LIMITS.ipPerMinute,
    });
    const withinVisitor =
      withinIp &&
      (await consumeRateLimit(config.supabase, {
        key: `reviews:visitor:${visitorHash}`,
        ...LIMITS.visitorPerDay,
      }));
    if (!withinIp || !withinVisitor) {
      return errorResponse(429, 'Demasiadas solicitudes. Esperá un momento.', origin, {
        'Retry-After': '60',
      });
    }
    await upsertReview(config.supabase, {
      slug: parsed.slug,
      visitorHash,
      rating: parsed.rating,
      comment: parsed.comment,
      locale: parsed.locale,
    });
    return jsonResponse({ slug: parsed.slug, saved: true }, 200, origin);
  } catch (error) {
    return storageFailure(error, origin);
  }
}
