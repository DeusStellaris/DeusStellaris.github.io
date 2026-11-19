import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from 'astro:env/client';
import { dedupe } from './dedupe';

/**
 * Cliente de LECTURA de Supabase para el navegador. Usa solo la clave anon: las políticas RLS
 * limitan qué se puede leer. Las escrituras no pasan por aquí; van al Worker de la API.
 *
 * Solo llama a funciones RPC de lectura que devuelven agregados (contadores), nunca filas de
 * la tabla de likes ni identificadores de visitante.
 */

const REQUEST_TIMEOUT_MS = 8_000;

export type SupabaseState =
  | { configured: true; url: string; anonKey: string }
  | { configured: false };

export function supabaseState(): SupabaseState {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return { configured: false };
  return { configured: true, url: PUBLIC_SUPABASE_URL, anonKey: PUBLIC_SUPABASE_ANON_KEY };
}

export class SupabaseRequestError extends Error {
  constructor(readonly status: number | 'network') {
    super(`supabase_${status}`);
    this.name = 'SupabaseRequestError';
  }
}

/**
 * Llama a una función RPC pública de Supabase.
 * @throws {SupabaseRequestError} si la red falla o la respuesta no es correcta.
 */
export function callReadRpc<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  return dedupe(`rpc:${name}:${JSON.stringify(body)}`, () => fetchRpc<T>(name, body));
}

async function fetchRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const state = supabaseState();
  if (!state.configured) throw new SupabaseRequestError('network');

  let response: Response;
  try {
    response = await fetch(`${state.url}/rest/v1/rpc/${encodeURIComponent(name)}`, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        apikey: state.anonKey,
        Authorization: `Bearer ${state.anonKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new SupabaseRequestError('network');
  }

  if (!response.ok) throw new SupabaseRequestError(response.status);
  return (await response.json()) as T;
}
