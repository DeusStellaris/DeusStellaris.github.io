/**
 * Convierte el texto legal con marcadores en segmentos. Función pura, probada en tests.
 *
 * Marcadores admitidos en el contenido:
 *   {{PENDING:descripción}}   → aviso visible de dato pendiente de confirmar.
 *   {{CONTROLLER}}            → nombre del responsable (de legal.json) o marcador pendiente.
 *   {{EMAIL}}                 → correo de contacto (de legal.json) o marcador pendiente.
 */

export type Segment =
  | { type: 'text'; value: string }
  | { type: 'pending'; value: string }
  | { type: 'value'; value: string };

export interface LegalValues {
  controllerName: string | null;
  email: string | null;
}

const MARKER = /\{\{(PENDING:[^}]*|CONTROLLER|EMAIL)\}\}/g;

export type LegalLocale = 'es' | 'en';

export function parseLegalText(text: string, values: LegalValues, locale: LegalLocale): Segment[] {
  const pendingLabel = locale === 'en' ? 'PENDING' : 'PENDIENTE';
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MARKER)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ type: 'text', value: text.slice(cursor, index) });
    const token = match[1] ?? '';
    if (token.startsWith('PENDING:')) {
      segments.push({
        type: 'pending',
        value: `[${pendingLabel}: ${token.slice('PENDING:'.length).trim()}]`,
      });
    } else if (token === 'CONTROLLER') {
      segments.push(
        values.controllerName
          ? { type: 'value', value: values.controllerName }
          : {
              type: 'pending',
              value: `[${pendingLabel}: ${locale === 'en' ? 'controller name' : 'nombre del responsable'}]`,
            },
      );
    } else if (token === 'EMAIL') {
      segments.push(
        values.email
          ? { type: 'value', value: values.email }
          : {
              type: 'pending',
              value: `[${pendingLabel}: ${locale === 'en' ? 'contact email' : 'correo de contacto'}]`,
            },
      );
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) segments.push({ type: 'text', value: text.slice(cursor) });
  return segments;
}

/** Cuenta los marcadores pendientes de un texto (para el informe de datos a confirmar). */
export function countPending(text: string, values: LegalValues, locale: LegalLocale): number {
  return parseLegalText(text, values, locale).filter((segment) => segment.type === 'pending')
    .length;
}
