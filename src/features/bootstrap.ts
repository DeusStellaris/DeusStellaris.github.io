import { initAccounts } from './accounts/accounts';
import { initAds } from './ads/ads';
import { initAssistant } from './assistant/assistant';
import { initConsent } from './consent/consent';
import { initFavorites } from './favorites/favorites';
import { runIntro } from './intro/intro';
import { initLikes, initRankings } from './likes/likes';
import { initLiteMode } from './preferences/lite-mode';
import { initThemePreferences } from './preferences/theme';
import { initProfile } from './profile/profile';
import { initSettingsPanel } from './settings/settings-panel';
import { initPushFollow } from './push/push-follow';
import { initPushPanel } from './push/push-panel';
import { initInstall } from './pwa/install';
import { registerServiceWorker } from './pwa/register';
import { initRum } from './rum/rum';
import { initSearchWidgets } from './search/search-widget';
import { initTooltips } from './tooltips/tooltips';

/**
 * Módulos de una sola página: se descargan solo si la página contiene su raíz, así el paquete
 * común no carga la galería, las reseñas, las demos ni los comentarios en las demás páginas.
 */
const PAGE_MODULES: ReadonlyArray<readonly [string, () => Promise<() => void>]> = [
  ['[data-hub]', async () => (await import('./hub/hub')).initHubGallery],
  ['[data-reviews]', async () => (await import('./reviews/reviews')).initReviews],
  ['[data-demo-player]', async () => (await import('./demos/demo-player')).initDemoPlayers],
  ['[data-deck-product]', async () => (await import('./deusdeck/product')).initDeckProduct],
  ['[data-copy-email]', async () => (await import('./contact/contact')).initContact],
  ['[data-faq]', async () => (await import('./faq/faq')).initFaq],
  ['[data-giscus-root]', async () => (await import('./comments/giscus')).initComments],
];

function initPageModules(): void {
  for (const [selector, load] of PAGE_MODULES) {
    if (document.querySelector(selector)) void load().then((init) => init());
  }
}

/**
 * Punto de entrada de la interactividad global. Se importa una sola vez desde BaseLayout.
 *
 * Con View Transitions la página se reemplaza en cada navegación y sus elementos son nuevos.
 * Los módulos registran sus listeners de documento una sola vez (idempotentes), y las
 * inicializaciones por elemento se repiten en `astro:page-load`.
 */
function initPage(): void {
  initFavorites();
  initProfile();
  initSettingsPanel();
  initPushPanel();
  initPushFollow();
  initInstall();
  initAssistant();
  initSearchWidgets();
  initLikes();
  initRankings();
  initConsent();
  initAds();
  initAccounts();
  initPageModules();
}

registerServiceWorker();
initRum();
initTooltips();
initThemePreferences();
initLiteMode();
initPage();
runIntro();
// runIntro es idempotente: en cada navegación solo retira el overlay si no corresponde reproducirlo.
document.addEventListener('astro:page-load', () => {
  initPage();
  runIntro();
});
