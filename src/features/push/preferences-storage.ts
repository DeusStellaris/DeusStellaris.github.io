import { readLocal, STORAGE_KEYS, writeLocal } from '../preferences/storage';
import { DEFAULT_PREFERENCES, normalizePreferences, type PushPreferences } from './preferences';

/** Preferencias de notificaciones guardadas en este navegador. */
export function loadPreferences(allowedCategories: readonly string[]): PushPreferences {
  try {
    return normalizePreferences(
      JSON.parse(readLocal(STORAGE_KEYS.pushPreferences) ?? 'null'),
      allowedCategories,
    );
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(preferences: PushPreferences): void {
  writeLocal(STORAGE_KEYS.pushPreferences, JSON.stringify(preferences));
}
