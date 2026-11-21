import { callReadRpc, supabaseState } from '../../lib/supabase-client';
import { loadSearchIndex } from '../search/search-client';
import type { SearchEntry } from '../search/search-core';
import { getVisitorId } from './visitor';

/**
 * Me gusta y ranking.
 *
 * - Escritura: POST al Worker de la API (validación, límite de frecuencia y hash del visitante
 *   en el servidor). El navegador envía solo un identificador anónimo aleatorio.
 * - Lectura: funciones RPC agregadas de Supabase (contadores, sin visitantes).
 * - Sin configuración, cada elemento muestra un estado explícito; nunca se inventan cifras.
 */

const TOGGLE_SELECTOR = '[data-like-toggle]';
const LIKED_KEY = 'deus:likes';
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

interface LikeResponse {
  slug: string;
  likes: number;
  liked: boolean;
}

interface RankingRow {
  project_slug: string;
  likes_count: number;
}

function isLikeResponse(value: unknown): value is LikeResponse {
  if (typeof value !== 'object' || value === null) return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body.slug === 'string' &&
    typeof body.likes === 'number' &&
    Number.isInteger(body.likes) &&
    body.likes >= 0 &&
    typeof body.liked === 'boolean'
  );
}

function isRankingRow(value: unknown): value is RankingRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.project_slug === 'string' &&
    SLUG_PATTERN.test(row.project_slug) &&
    typeof row.likes_count === 'number' &&
    Number.isInteger(row.likes_count) &&
    row.likes_count >= 0
  );
}

function readLikedSet(): Set<string> {
  try {
    const raw = window.localStorage.getItem(LIKED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [],
    );
  } catch {
    return new Set();
  }
}

function writeLikedSet(slugs: Set<string>): void {
  try {
    window.localStorage.setItem(LIKED_KEY, JSON.stringify([...slugs].slice(0, 500)));
  } catch {
    // Sin almacenamiento, el estado "te gusta" solo vale en esta página.
  }
}

function setCount(button: HTMLButtonElement, count: number | null): void {
  const target = button.querySelector<HTMLElement>('[data-like-count]');
  if (!target) return;
  target.classList.remove('skeleton');
  target.textContent =
    count === null ? '' : (button.dataset.countTemplate ?? '').replace('{count}', String(count));
}

async function toggleLike(button: HTMLButtonElement): Promise<void> {
  const slug = button.dataset.slug ?? '';
  const api = button.dataset.api ?? '';
  const status = button.parentElement?.querySelector<HTMLElement>('[data-like-status]');
  if (!SLUG_PATTERN.test(slug) || api === '') return;

  const wasLiked = button.getAttribute('aria-pressed') === 'true';
  button.disabled = true;
  try {
    const response = await fetch(`${api}/likes`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        slug,
        visitorId: getVisitorId(),
        action: wasLiked ? 'unlike' : 'like',
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const body: unknown = response.ok ? await response.json() : null;
    if (!isLikeResponse(body) || body.slug !== slug) throw new Error('like_response');

    button.setAttribute('aria-pressed', String(body.liked));
    button.dataset.liked = String(body.liked);
    setCount(button, body.likes);
    const set = readLikedSet();
    if (body.liked) set.add(slug);
    else set.delete(slug);
    writeLikedSet(set);
    if (status) status.textContent = '';
  } catch {
    if (status) status.textContent = button.dataset.msgError ?? '';
  } finally {
    button.disabled = false;
  }
}

/** Rellena los contadores de los botones de la página con una sola llamada RPC. */
async function fillCounts(buttons: readonly HTMLButtonElement[]): Promise<void> {
  if (buttons.length === 0 || !supabaseState().configured) return;
  try {
    const rows = await callReadRpc<unknown>('get_project_rankings', {});
    if (!Array.isArray(rows)) return;
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (isRankingRow(row)) counts.set(row.project_slug, row.likes_count);
    }
    for (const button of buttons) {
      const count = counts.get(button.dataset.slug ?? '') ?? 0;
      setCount(button, count);
    }
  } catch {
    // Los contadores no son críticos: el botón sigue funcionando sin cifra.
  } finally {
    for (const button of buttons) {
      button.querySelector('[data-like-count]')?.classList.remove('skeleton');
    }
  }
}

function syncLikedState(): void {
  const liked = readLikedSet();
  const buttons = [...document.querySelectorAll<HTMLButtonElement>(TOGGLE_SELECTOR)];
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(liked.has(button.dataset.slug ?? '')));
  }
  void fillCounts(buttons);
}

let listenersBound = false;

function bindOnce(): void {
  if (listenersBound) return;
  listenersBound = true;
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(TOGGLE_SELECTOR);
    if (button && !button.disabled) void toggleLike(button);
  });
}

/** Activa los me gusta de la página actual. Idempotente. */
export function initLikes(): void {
  bindOnce();
  syncLikedState();
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

interface RankingMessages {
  loading: string;
  error: string;
  unconfigured: string;
  empty: string;
  position: string;
  filterAll: string;
}

function readRankingMessages(root: HTMLElement): RankingMessages {
  const d = root.dataset;
  return {
    loading: d.msgLoading ?? '',
    error: d.msgError ?? '',
    unconfigured: d.msgUnconfigured ?? '',
    empty: d.msgEmpty ?? '',
    position: d.msgPosition ?? '',
    filterAll: d.msgFilterAll ?? '',
  };
}

interface RankedProject {
  slug: string;
  likes: number;
  entry: SearchEntry;
}

function renderRanking(
  list: HTMLElement,
  items: readonly RankedProject[],
  messages: RankingMessages,
): void {
  list.replaceChildren();
  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'ranking__item';

    const position = document.createElement('span');
    position.className = 'ranking__position';
    position.textContent = `${messages.position} ${index + 1}`;

    const link = document.createElement('a');
    link.href = item.entry.href;
    link.textContent = item.entry.title;

    const meta = document.createElement('span');
    meta.className = 'ranking__meta';
    meta.textContent = `${item.entry.category} · ${item.likes}`;

    li.append(position, link, meta);
    list.append(li);
  });
}

async function initRanking(root: HTMLElement): Promise<void> {
  if (root.dataset.rankingReady === 'true') return;
  root.dataset.rankingReady = 'true';

  const messages = readRankingMessages(root);
  const status = root.querySelector<HTMLElement>('[data-ranking-status]');
  const list = root.querySelector<HTMLElement>('[data-ranking-list]');
  const filter = root.querySelector<HTMLSelectElement>('[data-ranking-filter]');
  if (!status || !list || !filter) return;
  const locale = root.dataset.locale ?? 'es';

  if (!supabaseState().configured) {
    list.replaceChildren();
    status.textContent = messages.unconfigured;
    return;
  }

  status.textContent = messages.loading;
  let ranked: RankedProject[];
  try {
    const [rows, entries] = await Promise.all([
      callReadRpc<unknown>('get_project_rankings', {}),
      loadSearchIndex(),
    ]);
    if (!Array.isArray(rows)) throw new Error('ranking_shape');
    const projects = new Map<string, SearchEntry>();
    for (const entry of entries) {
      if (entry.type !== 'project' || entry.locale !== locale) continue;
      const slug = entry.id.split(':')[1];
      if (slug) projects.set(slug, entry);
    }
    ranked = rows
      .filter(isRankingRow)
      .flatMap((row) => {
        const entry = projects.get(row.project_slug);
        return entry ? [{ slug: row.project_slug, likes: row.likes_count, entry }] : [];
      })
      .sort((a, b) => b.likes - a.likes);
  } catch {
    list.replaceChildren();
    status.textContent = messages.error;
    return;
  }

  const categories = [
    ...new Set(ranked.map((item) => item.entry.category).filter((c) => c !== '')),
  ].sort();
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filter.append(option);
  }

  const render = (): void => {
    const selected = filter.value;
    const visible =
      selected === 'all' ? ranked : ranked.filter((item) => item.entry.category === selected);
    if (visible.length === 0) {
      list.replaceChildren();
      status.textContent = messages.empty;
      return;
    }
    status.textContent = '';
    renderRanking(list, visible, messages);
  };
  filter.addEventListener('change', render);
  render();
}

/** Activa los rankings de la página actual. Idempotente. */
export function initRankings(): void {
  for (const root of document.querySelectorAll<HTMLElement>('[data-ranking-root]')) {
    void initRanking(root);
  }
}
