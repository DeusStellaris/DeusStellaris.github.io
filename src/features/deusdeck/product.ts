import { formatSize, NOTE_GROUPS, PLATFORMS, parseManifest, resolveDownloadUrl } from './manifest';
import { detectOs } from './os-detect';

/**
 * Ficha de DeusDeck (DeusDeck/DeusDeckProduct.astro): muestra el sistema detectado, avisa si no hay
 * instalador para él y completa versión, enlaces, tamaño, hashes y notas desde version.json.
 */

const ROOT_SELECTOR = '[data-deck-product]';
const MANIFEST_TIMEOUT_MS = 8000;

function setText(root: HTMLElement, selector: string, text: string): void {
  for (const el of root.querySelectorAll<HTMLElement>(selector)) el.textContent = text;
}

async function fetchSize(url: string): Promise<number | null> {
  if (new URL(url).origin !== location.origin) return null;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
    });
    const bytes = Number(res.headers.get('content-length'));
    return res.ok && bytes > 0 ? bytes : null;
  } catch {
    return null;
  }
}

function renderNotes(root: HTMLElement, notes: Partial<Record<string, string[]>>): void {
  const target = root.querySelector<HTMLElement>('[data-deck-notes]');
  if (!target) return;
  const labels = JSON.parse(root.dataset.noteLabels ?? '{}') as Record<string, string>;
  for (const group of NOTE_GROUPS) {
    const items = notes[group];
    if (!items?.length) continue;
    const heading = document.createElement('h4');
    heading.textContent = labels[group] ?? group;
    const list = document.createElement('ul');
    list.className = 'deck__notes';
    for (const item of items)
      list.append(Object.assign(document.createElement('li'), { textContent: item }));
    target.append(heading, list);
  }
}

async function loadManifest(root: HTMLElement): Promise<void> {
  const panel = root.querySelector<HTMLElement>('[data-deck-manifest]');
  const error = root.querySelector<HTMLElement>('[data-deck-error]');
  try {
    const res = await fetch(root.dataset.manifestUrl ?? '', {
      cache: 'no-cache',
      signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
    });
    const manifest = res.ok ? parseManifest(await res.json()) : null;
    if (!manifest) throw new Error('manifiesto inválido');

    const locale = root.dataset.locale === 'en' ? 'en' : 'es';
    setText(root, '[data-deck-version]', `v${manifest.version}`);
    for (const platform of PLATFORMS) {
      const entry = manifest[platform];
      const url = resolveDownloadUrl(entry.url, location.origin);
      const link = root.querySelector<HTMLAnchorElement>(`[data-deck-download="${platform}"]`);
      link?.setAttribute('href', url);
      link?.removeAttribute('aria-disabled');
      setText(root, `[data-deck-sha="${platform}"]`, entry.sha256);
      void fetchSize(url).then((bytes) => {
        if (bytes) setText(root, `[data-deck-size="${platform}"]`, formatSize(bytes, locale));
      });
    }
    renderNotes(root, manifest.notes[locale]);
    if (panel) panel.hidden = false;
  } catch {
    if (error) error.hidden = false;
  }
}

function initProduct(root: HTMLElement): void {
  if (root.dataset.deckReady === 'true') return;
  root.dataset.deckReady = 'true';

  const os = detectOs(navigator.userAgent, navigator.maxTouchPoints);
  const names = JSON.parse(root.dataset.osNames ?? '{}') as Record<string, string>;
  const label = root.querySelector<HTMLElement>('[data-deck-os]');
  if (label) label.textContent = names[os] ?? os;

  const notice = root.querySelector<HTMLElement>('[data-deck-unsupported]');
  if (notice) notice.hidden = os === 'windows' || os === 'other';

  void loadManifest(root);
}

/** Activa la ficha de la página actual. Idempotente. */
export function initDeckProduct(): void {
  for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) initProduct(root);
}
