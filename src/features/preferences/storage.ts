/**
 * Acceso seguro a localStorage y sessionStorage.
 * Cualquier fallo (modo privado, almacenamiento bloqueado, cuota llena) se trata
 * como "sin preferencia guardada": la interfaz sigue funcionando con los valores por defecto.
 */

export const STORAGE_KEYS = {
  theme: 'deus:theme',
  liteMode: 'deus:lite-mode',
  introPlayed: 'deus:intro-played',
  pushPreferences: 'deus:push-preferences',
} as const;

export function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sin persistencia: la preferencia vale solo para esta página.
  }
}

export function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Sin persistencia de sesión: la animación podría repetirse; no es crítico.
  }
}
