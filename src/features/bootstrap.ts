import { runIntro } from './intro/intro';
import { initLiteMode } from './preferences/lite-mode';
import { initThemePreferences } from './preferences/theme';

/**
 * Punto de entrada de la interactividad global. Se importa una sola vez desde BaseLayout.
 * Cada módulo registra sus listeners una única vez, así que la navegación con
 * View Transitions no duplica comportamiento.
 */
initThemePreferences();
initLiteMode();
runIntro();
