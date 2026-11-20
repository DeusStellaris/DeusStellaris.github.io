// Prueba de carga controlada con k6: `npm run test:load` o `k6 run -e TARGET_URL=https://... tests/load/smoke.js`.
//
// Variables: TARGET_URL (sitio, por defecto http://localhost:4321), API_URL (Worker; sin él se omite
// la prueba de 429) y CHECK_HEADERS (1/0; por defecto solo fuera de localhost, porque astro preview
// no aplica public/_headers). Todo es de lectura: nada envía correos ni notificaciones.

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';

const TARGET = (__ENV.TARGET_URL || 'http://localhost:4321').replace(/\/$/, '');
const API = (__ENV.API_URL || '').replace(/\/$/, '');
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(TARGET);
const CHECK_HEADERS = __ENV.CHECK_HEADERS ? __ENV.CHECK_HEADERS === '1' : !LOCAL;

const limited = new Counter('rate_limited_429');

export const options = {
  scenarios: {
    // Rampa a 25 usuarios simultáneos durante 60 s (tope seguro para planes gratuitos).
    sitio: {
      executor: 'ramping-vus',
      exec: 'sitio',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 25 },
        { duration: '30s', target: 25 },
        { duration: '15s', target: 0 },
      ],
    },
    ...(API && {
      limite: {
        executor: 'per-vu-iterations',
        exec: 'limite',
        vus: 1,
        iterations: 1,
        startTime: '5s',
      },
    }),
  },
  thresholds: {
    'http_req_duration{scenario:sitio}': ['p(95)<500'],
    'http_req_failed{scenario:sitio}': ['rate<0.01'],
    'checks{scenario:sitio}': ['rate>0.99'],
    ...(API && { rate_limited_429: ['count>0'], 'checks{scenario:limite}': ['rate==1'] }),
  },
};

// SETUP: toma un recurso con hash de /_astro/ y un proyecto real del índice de búsqueda.
export function setup() {
  const home = http.get(`${TARGET}/`);
  const asset = /\/_astro\/[^"'\s)]+\.(?:css|js)/.exec(home.body || '');
  const index = http.get(`${TARGET}/search-index.json`).json();
  const project = (index?.entries || []).find((e) => e.type === 'project');
  return { asset: asset ? asset[0] : null, slug: project ? project.id.split(':')[1] : null };
}

function checkSecurity(res) {
  check(res, {
    nosniff: (r) => r.headers['X-Content-Type-Options'] === 'nosniff',
    'frame DENY': (r) => r.headers['X-Frame-Options'] === 'DENY',
    HSTS: (r) => (r.headers['Strict-Transport-Security'] || '').includes('max-age='),
    CSP: (r) => (r.headers['Content-Security-Policy'] || '').includes('frame-ancestors'),
  });
}

// ESCENARIO SITIO: páginas es/en, índices públicos y recurso inmutable.
export function sitio(data) {
  group('paginas', () => {
    for (const path of ['/', '/en/']) {
      const res = http.get(`${TARGET}${path}`);
      check(res, { 'página 200': (r) => r.status === 200 });
      if (CHECK_HEADERS) checkSecurity(res);
    }
  });
  group('datos', () => {
    const res = http.get(`${TARGET}/search-index.json`);
    check(res, { 'índice 200': (r) => r.status === 200 });
    if (CHECK_HEADERS) {
      check(res, {
        'índice con caché': (r) => /max-age=300/.test(r.headers['Cache-Control'] || ''),
      });
    }
  });
  if (data.asset) {
    const res = http.get(`${TARGET}${data.asset}`);
    check(res, { 'asset 200': (r) => r.status === 200 });
    if (CHECK_HEADERS) {
      check(res, {
        'asset inmutable': (r) => (r.headers['Cache-Control'] || '').includes('immutable'),
      });
    }
  }
  sleep(1);
}

// UUID v4 sin dependencias: el Worker solo valida el formato.
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
}

// ESCENARIO LÍMITE: "unlike" de un visitante nuevo no altera datos y consume el límite por IP (30/min).
export function limite(data) {
  if (!data.slug) return;
  const origin = new URL(TARGET).origin;
  const headers = { 'Content-Type': 'application/json', Origin: origin };
  let seen429 = false;
  for (let i = 0; i < 40; i++) {
    const body = JSON.stringify({ slug: data.slug, visitorId: uuid(), action: 'unlike' });
    const res = http.post(`${API}/likes`, body, { headers });
    if (res.status === 429) {
      limited.add(1);
      seen429 = true;
      check(res, { '429 con Retry-After': (r) => Boolean(r.headers['Retry-After']) });
      break;
    }
  }
  check(null, { 'se alcanzó el 429': () => seen429 });
}
