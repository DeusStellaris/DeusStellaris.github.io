import { initAds } from './ads/ads';
import { initAssistant } from './assistant/assistant';
import { initComments } from './comments/giscus';
import { initConsent } from './consent/consent';
import { initFavorites } from './favorites/favorites';
import { runIntro } from './intro/intro';
import { initLikes, initRankings } from './likes/likes';
import { initLiteMode } from './preferences/lite-mode';
import { initThemePreferences } from './preferences/theme';
import { initProfile } from './profile/profile';
import { initPushPanel } from './push/push-panel';
import { registerServiceWorker } from './pwa/register';
import { initSearchWidgets } from './search/search-widget';

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
  initPushPanel();
  initAssistant();
  initSearchWidgets();
  initLikes();
  initRankings();
  initComments();
  initConsent();
  initAds();
}

registerServiceWorker();
initThemePreferences();
initLiteMode();
initPage();
runIntro();
// runIntro es idempotente: en cada navegación solo retira el overlay si no corresponde reproducirlo.
document.addEventListener('astro:page-load', () => {
  initPage();
  runIntro();
});
