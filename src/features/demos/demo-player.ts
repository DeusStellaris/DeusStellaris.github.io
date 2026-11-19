/**
 * Reproductor de demos Click-to-Play (demos/DemoPlayer.astro).
 *
 * - Hasta pulsar «Jugar demo» no se crea ningún iframe ni se pide el juego.
 * - El juego corre en un iframe aislado: sandbox solo con scripts y puntero (sin allow-same-origin,
 *   así su origen es opaco y no toca los datos del sitio), sin referrer y con pantalla completa.
 * - Pantalla completa sobre el contenedor (la barra y los controles táctiles siguen visibles); donde
 *   no existe la API (iOS) se usa un modo pseudo pantalla completa por CSS.
 * - Los botones táctiles envían { type: 'deus-input', key, pressed } al juego con postMessage.
 */

const ROOT_SELECTOR = '[data-demo-player]';
const SANDBOX = 'allow-scripts allow-pointer-lock';
const PSEUDO_FULLSCREEN = 'is-pseudo-fullscreen';

interface PlayerMessages {
  iframeTitle: string;
  fullscreen: string;
  exitFullscreen: string;
}

interface Player {
  root: HTMLElement;
  stage: HTMLElement;
  poster: HTMLElement;
  live: HTMLElement;
  viewport: HTMLElement;
  src: string;
  messages: PlayerMessages;
}

function frameOf(player: Player): HTMLIFrameElement | null {
  return player.viewport.querySelector('iframe');
}

function loadFrame(player: Player): void {
  const frame = document.createElement('iframe');
  frame.title = player.messages.iframeTitle;
  frame.setAttribute('sandbox', SANDBOX);
  frame.setAttribute('allow', 'fullscreen; gamepad');
  frame.setAttribute('allowfullscreen', '');
  frame.referrerPolicy = 'no-referrer';
  frame.src = player.src;
  player.viewport.replaceChildren(frame);
}

function play(player: Player): void {
  player.poster.hidden = true;
  player.live.hidden = false;
  loadFrame(player);
  player.live.querySelector<HTMLElement>('[data-player-restart]')?.focus();
}

function close(player: Player): void {
  exitFullscreen(player);
  player.viewport.replaceChildren();
  player.live.hidden = true;
  player.poster.hidden = false;
  player.poster.querySelector<HTMLElement>('[data-player-play]')?.focus();
}

function isFullscreen(player: Player): boolean {
  return (
    document.fullscreenElement === player.stage ||
    player.stage.classList.contains(PSEUDO_FULLSCREEN)
  );
}

function exitFullscreen(player: Player): void {
  player.stage.classList.remove(PSEUDO_FULLSCREEN);
  if (document.fullscreenElement === player.stage) void document.exitFullscreen();
}

function syncFullscreenLabel(player: Player): void {
  const button = player.root.querySelector<HTMLElement>('[data-player-fullscreen]');
  if (button) {
    button.textContent = isFullscreen(player)
      ? player.messages.exitFullscreen
      : player.messages.fullscreen;
  }
}

async function toggleFullscreen(player: Player): Promise<void> {
  if (isFullscreen(player)) {
    exitFullscreen(player);
  } else if (document.fullscreenEnabled) {
    await player.stage.requestFullscreen().catch(() => undefined);
  } else {
    player.stage.classList.add(PSEUDO_FULLSCREEN);
  }
  syncFullscreenLabel(player);
}

function sendKey(player: Player, key: string, pressed: boolean): void {
  frameOf(player)?.contentWindow?.postMessage({ type: 'deus-input', key, pressed }, '*');
}

function bindTouch(player: Player): void {
  const pads = player.root.querySelector<HTMLElement>('[data-player-touch]');
  if (!pads) return;
  const release = (event: PointerEvent): void => {
    const pad = (event.target as Element).closest<HTMLElement>('[data-key]');
    if (pad?.dataset.key) sendKey(player, pad.dataset.key, false);
  };
  pads.addEventListener('pointerdown', (event) => {
    const pad = (event.target as Element).closest<HTMLElement>('[data-key]');
    if (!pad?.dataset.key) return;
    pad.setPointerCapture(event.pointerId);
    sendKey(player, pad.dataset.key, true);
  });
  pads.addEventListener('pointerup', release);
  pads.addEventListener('pointercancel', release);
}

function initPlayer(root: HTMLElement): void {
  if (root.dataset.playerReady === 'true') return;
  root.dataset.playerReady = 'true';

  const stage = root.querySelector<HTMLElement>('[data-player-stage]');
  const poster = root.querySelector<HTMLElement>('[data-player-poster]');
  const live = root.querySelector<HTMLElement>('[data-player-live]');
  const viewport = root.querySelector<HTMLElement>('[data-player-viewport]');
  if (!stage || !poster || !live || !viewport) return;

  const player: Player = {
    root,
    stage,
    poster,
    live,
    viewport,
    src: root.dataset.src ?? '',
    messages: JSON.parse(root.dataset.messages ?? '{}') as PlayerMessages,
  };

  root.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target;
    if (target.closest('[data-player-play]')) play(player);
    else if (target.closest('[data-player-restart]')) loadFrame(player);
    else if (target.closest('[data-player-close]')) close(player);
    else if (target.closest('[data-player-fullscreen]')) void toggleFullscreen(player);
  });
  stage.addEventListener('fullscreenchange', () => syncFullscreenLabel(player));
  bindTouch(player);
}

/** Activa los reproductores de la página actual. Idempotente. */
export function initDemoPlayers(): void {
  for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) initPlayer(root);
}
