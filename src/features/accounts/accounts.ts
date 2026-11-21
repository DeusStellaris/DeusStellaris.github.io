/**
 * Cuenta opcional (account/AccountPanel.astro). Crea la cuenta o inicia sesión contra el Worker.
 * La contraseña viaja solo por HTTPS al Worker, que la guarda como hash PBKDF2-SHA256; aquí nunca se
 * guarda. La sesión (una hora) es una cookie HttpOnly del Worker: este código nunca ve el token.
 */

const ROOT_SELECTOR = '[data-account]';
const API_TIMEOUT_MS = 15_000;

type Action = 'register' | 'login';

function isAction(value: string | undefined): value is Action {
  return value === 'register' || value === 'login';
}

async function send(
  api: string,
  action: Action,
  credentials: { email: string; password: string },
): Promise<number> {
  const response = await fetch(`${api}/accounts/${action}`, {
    method: 'POST',
    // include: el login recibe la cookie de sesión HttpOnly (SameSite=Strict) del Worker.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(credentials),
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  return response.status;
}

function messageFor(status: number, messages: Record<string, string>): string {
  if (status === 201) return messages.registered ?? '';
  if (status === 200) return messages.loggedIn ?? '';
  if (status === 400) return messages.invalid ?? '';
  if (status === 401) return messages.wrongCredentials ?? '';
  if (status === 409) return messages.taken ?? '';
  if (status === 429) return messages.rateLimited ?? '';
  return messages.error ?? '';
}

function initAccount(root: HTMLElement): void {
  if (root.dataset.accountReady === 'true') return;
  root.dataset.accountReady = 'true';
  const api = root.dataset.api ?? '';
  const messages = JSON.parse(root.dataset.messages ?? '{}') as Record<string, string>;
  const form = root.querySelector<HTMLFormElement>('[data-account-form]');
  const status = root.querySelector<HTMLElement>('[data-account-status]');
  if (!form || !status || api === '') return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const action = (event.submitter as HTMLElement | null)?.dataset.accountAction;
    if (!isAction(action)) return;

    const data = new FormData(form);
    const credentials = {
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
    };
    status.textContent = messages.working ?? '';
    send(api, action, credentials)
      .then((code) => {
        status.textContent = messageFor(code, messages);
      })
      .catch(() => {
        status.textContent = messages.error ?? '';
      })
      .finally(() => form.reset());
  });
}

/** Activa el panel de cuenta, si está en la página. Idempotente. */
export function initAccounts(): void {
  for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) initAccount(root);
}
