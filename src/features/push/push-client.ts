import type { PushPreferences } from './preferences';

/**
 * Acceso a la Web Push API y al Worker. Sin estado propio: el panel decide cuándo llamar.
 * La clave VAPID pública llega por PUBLIC_VAPID_PUBLIC_KEY; la privada solo existe en el Worker.
 */

export type PushSupport = 'unsupported' | 'ios-install' | 'ready';

const API_TIMEOUT_MS = 8_000;

function isIos(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  return (
    /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}

/** iOS solo admite push en la app instalada en la pantalla de inicio. */
export function pushSupport(): PushSupport {
  if (isIos() && !isStandalone()) return 'ios-install';
  const supported =
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  return supported ? 'ready' : 'unsupported';
}

export function notificationPermission(): NotificationPermission {
  return 'Notification' in window ? Notification.permission : 'denied';
}

export function requestPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission();
}

function decodeVapidKey(key: string): Uint8Array<ArrayBuffer> {
  const padded = key
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(key.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

/** Registro del Service Worker del sitio, o null si no está activo (desarrollo o sin soporte). */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)) ?? null;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  return (await (await registration())?.pushManager.getSubscription()) ?? null;
}

/** Devuelve la suscripción existente o crea una nueva. Null si no hay Service Worker activo. */
export async function ensureSubscription(vapidKey: string): Promise<PushSubscription | null> {
  const active = await registration();
  if (!active) return null;
  const existing = await active.pushManager.getSubscription();
  return (
    existing ??
    active.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(vapidKey),
    })
  );
}

async function post(api: string, path: string, body: unknown): Promise<void> {
  const response = await fetch(`${api}${path}`, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`push_api_${response.status}`);
}

export function syncSubscription(
  api: string,
  subscription: PushSubscription,
  preferences: PushPreferences,
  locale: string,
): Promise<void> {
  return post(api, '/push/subscribe', { subscription: subscription.toJSON(), preferences, locale });
}

/** Cancela la suscripción del navegador y la borra del servidor (si hay API configurada). */
export async function cancelSubscription(api: string): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  const { endpoint } = subscription;
  await subscription.unsubscribe();
  if (api !== '') await post(api, '/push/unsubscribe', { endpoint });
}
