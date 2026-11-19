/**
 * Sistema operativo del visitante a partir del user agent. Se usa solo para elegir el instalador
 * que se muestra; nunca se envía a ningún servidor. iPadOS se anuncia como Macintosh con pantalla táctil.
 */

export type OsId = 'windows' | 'mac' | 'linux' | 'other';

export function detectOs(userAgent: string, maxTouchPoints = 0): OsId {
  if (/iPhone|iPad|iPod|Android/i.test(userAgent)) return 'other';
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'other';
  if (/Windows/i.test(userAgent)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'mac';
  if (/Linux|X11|CrOS/i.test(userAgent)) return 'linux';
  return 'other';
}
