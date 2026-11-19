import { dedupe, forget } from '../../lib/dedupe';
import { fill } from '../../lib/fill';
import { getVisitorId } from '../likes/visitor';

/**
 * Reseñas reales de una demo (demos/Reviews.astro). Lee y envía al Worker de la API; no hay reseñas
 * de ejemplo. Todo texto del servidor se pinta con textContent: nunca se interpreta como HTML.
 */

const ROOT_SELECTOR = '[data-reviews]';
const API_TIMEOUT_MS = 8_000;

interface Review {
  rating: number;
  comment: string;
}

interface ReviewsPayload {
  count: number;
  average: number | null;
  /** Ausente en Workers anteriores a la paginación: se trata como sin más páginas. */
  hasMore?: boolean;
  reviews: Review[];
}

interface View {
  root: HTMLElement;
  api: string;
  slug: string;
  locale: string;
  messages: Record<string, string>;
  loaded: number;
}

function isPayload(value: unknown): value is ReviewsPayload {
  const body = value as Partial<ReviewsPayload> | null;
  return (
    typeof body?.count === 'number' &&
    Array.isArray(body.reviews) &&
    body.reviews.every(
      (review) =>
        typeof review?.rating === 'number' &&
        review.rating >= 1 &&
        review.rating <= 5 &&
        typeof review.comment === 'string',
    )
  );
}

const stars = (rating: number): string => '★'.repeat(rating) + '☆'.repeat(5 - rating);

function setText(root: HTMLElement, selector: string, text: string): void {
  const element = root.querySelector<HTMLElement>(selector);
  if (element) element.textContent = text;
}

function reviewItem(review: Review): HTMLLIElement {
  const item = document.createElement('li');
  const rating = document.createElement('span');
  rating.className = 'reviews__item-stars';
  rating.textContent = stars(review.rating);
  item.append(rating);
  if (review.comment !== '') {
    const comment = document.createElement('p');
    comment.textContent = review.comment;
    item.append(comment);
  }
  return item;
}

/** Con `append`, agrega la página nueva al final en vez de repintar la lista. */
function renderPayload(view: View, payload: ReviewsPayload, append: boolean): void {
  const { root, messages } = view;
  const list = root.querySelector<HTMLElement>('[data-reviews-list]');
  const more = root.querySelector<HTMLButtonElement>('[data-reviews-more]');
  if (!list) return;
  list.removeAttribute('aria-busy');

  if (payload.count === 0) {
    setText(root, '[data-reviews-summary]', messages.none ?? '');
    list.replaceChildren();
    if (more) more.hidden = true;
    return;
  }
  const average = (payload.average ?? 0).toFixed(1);
  const template = payload.count === 1 ? messages.summaryOne : messages.summary;
  setText(root, '[data-reviews-summary]', fill(template ?? '', { avg: average, n: payload.count }));

  const items = payload.reviews.map(reviewItem);
  if (append) list.append(...items);
  else list.replaceChildren(...items);
  view.loaded = list.children.length;
  if (more) more.hidden = payload.hasMore !== true;
}

function fetchReviews(view: View, offset: number, fresh: boolean): Promise<ReviewsPayload> {
  const url = `${view.api}/reviews?slug=${encodeURIComponent(view.slug)}&offset=${offset}`;
  const load = async (): Promise<ReviewsPayload> => {
    const response = await fetch(url, {
      credentials: 'omit',
      cache: fresh ? 'reload' : 'default',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    const body: unknown = response.ok ? await response.json() : null;
    if (!isPayload(body)) throw new Error('reviews_shape');
    return body;
  };
  if (fresh) forget(url);
  return dedupe(url, load);
}

async function loadReviews(view: View, { append = false, fresh = false } = {}): Promise<void> {
  try {
    renderPayload(view, await fetchReviews(view, append ? view.loaded : 0, fresh), append);
  } catch {
    if (!append) view.root.querySelector('[data-reviews-list]')?.replaceChildren();
    setText(view.root, '[data-reviews-summary]', view.messages.loadError ?? '');
  }
}

function lightStars(root: HTMLElement, rating: number): void {
  for (const star of root.querySelectorAll<HTMLElement>('.reviews__star')) {
    const value = Number(star.querySelector('input')?.value);
    star.classList.toggle('is-lit', value <= rating);
  }
}

async function submit(view: View, form: HTMLFormElement): Promise<void> {
  const { messages } = view;
  const feedback = (text: string): void => setText(view.root, '[data-reviews-feedback]', text);
  const rating = Number(
    form.querySelector<HTMLInputElement>('input[name="rating"]:checked')?.value,
  );
  if (!(rating >= 1 && rating <= 5)) {
    feedback(messages.ratingRequired ?? '');
    return;
  }
  const comment = form.querySelector<HTMLTextAreaElement>('textarea')?.value ?? '';
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button) button.disabled = true;
  feedback(messages.sending ?? '');

  try {
    const response = await fetch(`${view.api}/reviews`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        slug: view.slug,
        visitorId: getVisitorId(),
        rating,
        comment,
        locale: view.locale,
      }),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (response.status === 429) feedback(messages.rateLimited ?? '');
    else if (!response.ok) feedback(messages.error ?? '');
    else {
      feedback(messages.thanks ?? '');
      await loadReviews(view, { fresh: true });
    }
  } catch {
    feedback(messages.error ?? '');
  } finally {
    if (button) button.disabled = false;
  }
}

function initReviewsOf(root: HTMLElement): void {
  if (root.dataset.reviewsReady === 'true' || root.dataset.api === '') return;
  root.dataset.reviewsReady = 'true';
  const view: View = {
    root,
    api: root.dataset.api ?? '',
    slug: root.dataset.slug ?? '',
    locale: root.dataset.locale ?? 'es',
    messages: JSON.parse(root.dataset.messages ?? '{}') as Record<string, string>,
    loaded: 0,
  };

  const form = root.querySelector<HTMLFormElement>('[data-reviews-form]');
  const textarea = form?.querySelector<HTMLTextAreaElement>('textarea');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    void submit(view, form);
  });
  form?.addEventListener('change', (event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.name === 'rating') {
      lightStars(root, Number(input.value));
    }
  });
  textarea?.addEventListener('input', () => {
    setText(
      root,
      '[data-reviews-counter]',
      fill(view.messages.counter ?? '', { n: textarea.value.length }),
    );
  });
  root
    .querySelector('[data-reviews-more]')
    ?.addEventListener('click', () => void loadReviews(view, { append: true }));
  void loadReviews(view);
}

/** Activa las reseñas de la página actual. Idempotente. */
export function initReviews(): void {
  for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) initReviewsOf(root);
}
