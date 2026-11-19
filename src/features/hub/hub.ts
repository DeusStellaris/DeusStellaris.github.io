import { debounce } from '../../lib/debounce';
import { fill } from '../../lib/fill';
import {
  filterResources,
  type HubCategory,
  type HubFilter,
  type HubResource,
  installUrl,
  type Locale,
  normalizeResources,
} from './hub-core';

/**
 * Galería del DeusDeck Hub (DeusDeck/HubGallery.astro). Carga el catálogo, filtra por categoría y
 * por texto (con debounce) y pinta tarjetas clonando una plantilla del HTML: todo texto entra con
 * textContent, nunca como HTML. El texto traducido llega por data-messages.
 */

const ROOT_SELECTOR = '[data-hub]';
const SEARCH_DEBOUNCE_MS = 250;
const FETCH_TIMEOUT_MS = 8_000;

interface HubView {
  root: HTMLElement;
  locale: Locale;
  messages: Record<string, string>;
  resources: HubResource[];
  filter: HubFilter;
}

const field = (scope: ParentNode, name: string): HTMLElement | null =>
  scope.querySelector<HTMLElement>(`[data-f="${name}"]`);

function setText(scope: ParentNode, name: string, text: string): void {
  const element = field(scope, name);
  if (element) element.textContent = text;
}

function setLink(scope: ParentNode, name: string, href: string | null, label: string): void {
  const link = field(scope, name) as HTMLAnchorElement | null;
  if (!link) return;
  link.hidden = href === null;
  if (href === null) return;
  link.href = href;
  link.textContent = label;
}

function setPreview(scope: ParentNode, view: HubView, resource: HubResource): void {
  const image = scope.querySelector<HTMLImageElement>('img');
  const fallback = field(scope, 'nopreview');
  if (!image || !fallback) return;
  const hasPreview = resource.previewUrl !== null;
  image.hidden = !hasPreview;
  fallback.hidden = hasPreview;
  fallback.textContent = view.messages['hub.noPreview'] ?? '';
  if (hasPreview && resource.previewUrl) {
    image.src = resource.previewUrl;
    image.alt = fill(view.messages['hub.previewAlt'] ?? '', { name: resource.name[view.locale] });
  }
}

function fillCommon(scope: ParentNode, view: HubView, resource: HubResource): void {
  const { messages, locale } = view;
  setText(scope, 'name', resource.name[locale]);
  setText(scope, 'compat', fill(messages['hub.compat'] ?? '', { v: resource.minAppVersion }));
  setPreview(scope, view, resource);
}

function renderCard(view: HubView, template: HTMLTemplateElement, resource: HubResource): Node {
  const card = template.content.cloneNode(true) as DocumentFragment;
  const { messages, locale } = view;
  fillCommon(card, view, resource);
  setText(card, 'category', messages[`hub.categories.${resource.category}`] ?? resource.category);
  setText(card, 'author', `${messages['hub.by'] ?? ''} ${resource.author}`);
  const details = field(card, 'details');
  if (details) {
    details.textContent = messages['hub.details'] ?? '';
    details.dataset.hubOpen = resource.id;
    details.setAttribute(
      'aria-label',
      `${messages['hub.details'] ?? ''}: ${resource.name[locale]}`,
    );
  }
  return card;
}

function openDetails(view: HubView, resource: HubResource): void {
  const dialog = view.root.querySelector<HTMLDialogElement>('[data-hub-dialog]');
  if (!dialog) return;
  const { messages, locale } = view;
  fillCommon(dialog, view, resource);
  setText(dialog, 'description', resource.description[locale]);
  setText(
    dialog,
    'meta',
    `${messages['hub.by'] ?? ''} ${resource.author} · ${messages['hub.version'] ?? ''} ${resource.version}`,
  );
  setLink(
    dialog,
    'install',
    resource.installable ? installUrl(resource.id) : null,
    messages['hub.install'] ?? '',
  );
  setLink(dialog, 'download', resource.downloadUrl, messages['hub.download'] ?? '');
  if (!dialog.open) dialog.showModal();
}

function render(view: HubView): void {
  const { root, messages } = view;
  const grid = root.querySelector<HTMLElement>('[data-hub-grid]');
  const status = root.querySelector<HTMLElement>('[data-hub-status]');
  const template = root.querySelector<HTMLTemplateElement>('[data-hub-card-template]');
  if (!grid || !status || !template) return;

  const visible = filterResources(view.resources, view.filter);
  grid.replaceChildren(...visible.map((resource) => renderCard(view, template, resource)));
  status.textContent =
    visible.length === 0
      ? (messages['hub.noResults'] ?? '')
      : fill(messages['hub.count'] ?? '', { n: visible.length });
}

async function loadResources(src: string): Promise<HubResource[]> {
  const response = await fetch(src, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error('hub_http');
  return normalizeResources(await response.json());
}

function bind(view: HubView): void {
  const { root } = view;
  const search = root.querySelector<HTMLInputElement>('[data-hub-search]');
  const updateQuery = debounce((query: string) => {
    view.filter = { ...view.filter, query };
    render(view);
  }, SEARCH_DEBOUNCE_MS);
  search?.addEventListener('input', () => updateQuery(search.value));

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.name !== 'hub-category') return;
    view.filter = { ...view.filter, category: input.value as HubCategory | 'all' };
    render(view);
  });

  root.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[data-hub-close]')) {
      root.querySelector<HTMLDialogElement>('[data-hub-dialog]')?.close();
      return;
    }
    const open = event.target.closest<HTMLElement>('[data-hub-open]');
    const resource = view.resources.find((item) => item.id === open?.dataset.hubOpen);
    if (resource) openDetails(view, resource);
  });
}

async function initHub(root: HTMLElement): Promise<void> {
  if (root.dataset.hubReady === 'true') return;
  root.dataset.hubReady = 'true';

  const locale: Locale = root.dataset.locale === 'en' ? 'en' : 'es';
  const messages = JSON.parse(root.dataset.messages ?? '{}') as Record<string, string>;
  const view: HubView = {
    root,
    locale,
    messages,
    resources: [],
    filter: { category: 'all', query: '', locale },
  };
  const status = root.querySelector<HTMLElement>('[data-hub-status]');
  const empty = root.querySelector<HTMLElement>('[data-hub-empty]');
  const toolbar = root.querySelector<HTMLElement>('[data-hub-toolbar]');

  try {
    view.resources = await loadResources(root.dataset.src ?? '');
  } catch {
    if (status) status.textContent = messages['hub.loadError'] ?? '';
    return;
  }

  if (view.resources.length === 0) {
    if (status) status.textContent = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (toolbar) toolbar.hidden = false;
  bind(view);
  render(view);
}

/** Activa la galería de la página actual. Idempotente. */
export function initHubGallery(): void {
  for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) void initHub(root);
}
