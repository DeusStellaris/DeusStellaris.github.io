/**
 * Identificador anónimo de visitante para los me gusta. Es un UUID aleatorio guardado en este
 * navegador: no contiene datos personales. El servidor lo combina con un secreto antes de
 * guardarlo, así que nunca se almacena en claro.
 */

const STORAGE_KEY = 'deus:visitor';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let memoryId: string | null = null;

function newId(): string {
  return crypto.randomUUID();
}

export function getVisitorId(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && UUID_PATTERN.test(stored)) return stored;
    const id = newId();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Sin almacenamiento: identificador válido solo durante esta sesión de página.
    memoryId ??= newId();
    return memoryId;
  }
}
