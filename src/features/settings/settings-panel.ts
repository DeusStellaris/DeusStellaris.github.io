import { toggleLiteMode } from '../preferences/lite-mode';
import { toggleTheme } from '../preferences/theme';

/**
 * Panel de ajustes estilo menú de videojuego: al enfocar o pasar el mouse sobre una opción, el panel
 * fijo inferior muestra su descripción y su impacto estimado en recursos. Los textos llegan ya
 * traducidos en data-settings-info (JSON), así que aquí no hay idioma ni lógica de negocio.
 */

const ROW_SELECTOR = '[data-settings-row]';
const TOGGLE_SELECTOR = '[data-settings-toggle]';
const DETAIL_SELECTOR = '[data-settings-detail]';

interface SettingsInfo {
  title: string;
  text: string;
  impact: ReadonlyArray<{ label: string; value: string }>;
}

function parseInfo(raw: string | undefined): SettingsInfo | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SettingsInfo;
  } catch {
    return null;
  }
}

function showDetail(row: HTMLElement): void {
  const detail = row.closest('dialog')?.querySelector<HTMLElement>(DETAIL_SELECTOR);
  const info = parseInfo(row.dataset.settingsInfo);
  if (!detail || !info) return;

  const title = detail.querySelector<HTMLElement>('[data-settings-title]');
  const text = detail.querySelector<HTMLElement>('[data-settings-text]');
  const impact = detail.querySelector<HTMLElement>('[data-settings-impact]');
  if (title) title.textContent = info.title;
  if (text) text.textContent = info.text;
  if (impact) {
    impact.replaceChildren(
      ...info.impact.flatMap(({ label, value }) => {
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value;
        return [dt, dd];
      }),
    );
  }
  for (const other of row.closest('dialog')?.querySelectorAll(ROW_SELECTOR) ?? []) {
    other.toggleAttribute('data-selected', other === row);
  }
}

/** Refleja el estado real (Lite y tema) en cada fila. */
function syncStates(): void {
  const root = document.documentElement;
  const states = {
    lite: root.classList.contains('lite-mode'),
    theme: root.dataset.theme === 'light',
  };
  for (const row of document.querySelectorAll<HTMLElement>(TOGGLE_SELECTOR)) {
    const on = states[row.dataset.settingsToggle as keyof typeof states];
    const state = row.querySelector<HTMLElement>('[data-settings-state]');
    if (state) state.textContent = (on ? row.dataset.stateOn : row.dataset.stateOff) ?? '';
    if (row.dataset.settingsToggle === 'lite') row.setAttribute('aria-pressed', String(on));
  }
}

/** Delegación de eventos: el diálogo vive en el layout y no se reemplaza al navegar. */
export function initSettingsPanel(): void {
  for (const type of ['focusin', 'mouseover'] as const) {
    document.addEventListener(type, (event) => {
      if (!(event.target instanceof Element)) return;
      const row = event.target.closest<HTMLElement>(ROW_SELECTOR);
      if (row) showDetail(row);
    });
  }
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const kind = event.target.closest<HTMLElement>(TOGGLE_SELECTOR)?.dataset.settingsToggle;
    if (!kind) return;
    if (kind === 'lite') toggleLiteMode();
    else toggleTheme();
    syncStates();
  });
  // Al abrir el perfil se muestra la primera opción, para que el panel nunca quede vacío.
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-profile-open]')) return;
    const first = document.querySelector<HTMLElement>(ROW_SELECTOR);
    syncStates();
    if (first) showDetail(first);
  });
}
