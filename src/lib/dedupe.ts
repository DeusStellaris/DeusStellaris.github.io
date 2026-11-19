/**
 * Deduplicación de peticiones en el cliente: llamadas iguales dentro de la ventana comparten la misma
 * promesa (en vuelo o ya resuelta). Un fallo se descarta al instante para permitir reintentar.
 */
const entries = new Map<string, { at: number; promise: Promise<unknown> }>();

export function dedupe<T>(key: string, load: () => Promise<T>, ttlMs = 5_000): Promise<T> {
  const hit = entries.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise as Promise<T>;
  const promise = load().catch((error: unknown) => {
    entries.delete(key);
    throw error;
  });
  entries.set(key, { at: Date.now(), promise });
  return promise;
}

/** Olvida una clave (p. ej. tras escribir, para que la siguiente lectura sea fresca). */
export function forget(key: string): void {
  entries.delete(key);
}
