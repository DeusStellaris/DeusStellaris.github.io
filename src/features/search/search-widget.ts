import { loadSearchIndex } from './search-client';
import { type SearchEntry, type SearchSection, sanitizeQuery, searchEntries } from './search-core';

/**
 * Controlador del buscador. Un mismo componente sirve para la página de búsqueda y para el
 * asistente flotante: se configura con data-* y no depende de la página.
 *
 * Todo texto dinámico se escribe con textContent, nunca con innerHTML. La consulta se acota a 100
 * caracteres y se compara con includes (sin expresiones regulares), así no hay ReDoS.
 */

const DEBOUNCE_MS = 150;
const ROOT_SELECTOR = '[data-search-widget]';

interface Messages {
  loading: string;
  error: string;
  hint: string;
  noResults: string;
  count: string;
  typeSection: string;
  typeProject: string;
}

function readMessages(root: HTMLElement): Messages {
  const data = root.dataset;
  return {
    loading: data.msgLoading ?? '',
    error: data.msgError ?? '',
    hint: data.msgHint ?? '',
    noResults: data.msgNoResults ?? '',
    count: data.msgCount ?? '',
    typeSection: data.msgTypeSection ?? '',
    typeProject: data.msgTypeProject ?? '',
  };
}

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template,
  );
}

function asSection(value: string): SearchSection | 'all' {
  const sections: readonly string[] = ['home', 'games', 'programs', 'freelance', 'contact'];
  return sections.includes(value) ? (value as SearchSection) : 'all';
}

function renderResults(
  list: HTMLElement,
  entries: readonly SearchEntry[],
  messages: Messages,
): void {
  list.replaceChildren();
  for (const entry of entries) {
    const item = document.createElement('li');
    item.className = 'search-result';

    const link = document.createElement('a');
    link.className = 'search-result__title';
    link.href = entry.href;
    link.textContent = entry.title;

    const meta = document.createElement('p');
    meta.className = 'search-result__meta';
    const typeLabel = entry.type === 'project' ? messages.typeProject : messages.typeSection;
    meta.textContent = entry.category ? `${typeLabel} · ${entry.category}` : typeLabel;

    const summary = document.createElement('p');
    summary.className = 'search-result__summary';
    summary.textContent = entry.summary;

    item.append(link, meta, summary);
    list.append(item);
  }
}

function setStatus(status: HTMLElement, text: string): void {
  status.textContent = text;
}

function initWidget(root: HTMLElement): void {
  if (root.dataset.searchReady === 'true') return;
  root.dataset.searchReady = 'true';

  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const list = root.querySelector<HTMLElement>('[data-search-results]');
  const status = root.querySelector<HTMLElement>('[data-search-status]');
  const retry = root.querySelector<HTMLButtonElement>('[data-search-retry]');
  const clear = root.querySelector<HTMLButtonElement>('[data-search-clear]');
  const filter = root.querySelector<HTMLSelectElement>('[data-search-filter]');
  const form = root.querySelector<HTMLFormElement>('[data-search-form]');
  if (!input || !list || !status) return;
  // Constantes tipadas: las funciones internas no heredan el estrechamiento de la comprobación.
  const resultList: HTMLElement = list;
  const statusEl: HTMLElement = status;

  const messages = readMessages(root);
  const context = asSection(root.dataset.context ?? '');
  // Con categoría fija (buscador de sección) solo se buscan proyectos de esa categoría.
  const scope = asSection(root.dataset.scope ?? '');
  let timer: number | undefined;
  let lastQuery = '';

  form?.addEventListener('submit', (event) => event.preventDefault());

  async function run(): Promise<void> {
    const query = sanitizeQuery(input?.value ?? '');
    lastQuery = query;
    if (retry) retry.hidden = true;

    let entries: SearchEntry[];
    try {
      setStatus(statusEl, messages.loading);
      entries = await loadSearchIndex();
    } catch {
      resultList.replaceChildren();
      setStatus(statusEl, messages.error);
      if (retry) retry.hidden = false;
      return;
    }

    // Si el visitante escribió otra cosa mientras cargaba, este resultado ya no aplica.
    if (query !== lastQuery) return;

    const outcome = searchEntries(entries, query, {
      section: scope === 'all' ? asSection(filter?.value ?? 'all') : scope,
      contextSection: context === 'all' ? undefined : context,
      type: scope === 'all' ? undefined : 'project',
      locale: root.dataset.locale === 'en' ? 'en' : 'es',
    });

    if (outcome.status === 'hint') {
      resultList.replaceChildren();
      setStatus(statusEl, messages.hint);
      return;
    }
    renderResults(resultList, outcome.results, messages);
    if (outcome.total === 0) {
      setStatus(statusEl, fill(messages.noResults, { query }));
    } else {
      setStatus(statusEl, fill(messages.count, { count: outcome.total }));
    }
  }

  function schedule(): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void run(), DEBOUNCE_MS);
  }

  input.addEventListener('input', schedule);
  filter?.addEventListener('change', () => void run());
  retry?.addEventListener('click', () => void run());
  clear?.addEventListener('click', () => {
    input.value = '';
    lastQuery = '';
    resultList.replaceChildren();
    setStatus(statusEl, messages.hint);
    input.focus();
  });

  if (root.dataset.prefillFromUrl === 'true') {
    const fromUrl = new URLSearchParams(window.location.search).get('q');
    if (fromUrl) {
      input.value = fromUrl;
      void run();
    }
  }
}

/** Inicializa todos los buscadores de la página. Idempotente. */
export function initSearchWidgets(): void {
  for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) {
    initWidget(root);
  }
}
