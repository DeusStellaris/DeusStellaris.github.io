// Auditoría Lighthouse real sobre el sitio compilado (requiere el servidor de vista previa en marcha).
// Uso: node scripts/lighthouse.mjs [ruta-extra ...]
// Genera informes JSON en tests/perf/.reports/ y el resumen en docs/testing/lighthouse-results.md.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const BASE = process.env.LH_BASE ?? 'http://localhost:4321';
const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CATEGORIES = 'performance,accessibility,best-practices,seo';
const PAGES = [
  ['Portada', '/'],
  ['Juegos', '/juegos/'],
  ['Programas', '/programas/'],
  ['Freelance', '/freelance/'],
  ['Documento legal (términos)', '/terminos/'],
  ...process.argv.slice(2).map((path) => [`Extra ${path}`, path]),
];
const PRESETS = [
  ['escritorio', ['--preset=desktop']],
  ['móvil', []],
];

const reportsDir = join(root, 'tests', 'perf', '.reports');
mkdirSync(reportsDir, { recursive: true });

const rows = [];
let counter = 0;
for (const [pageName, path] of PAGES) {
  for (const [presetName, presetArgs] of PRESETS) {
    counter += 1;
    const output = join(reportsDir, `lh-${counter}.json`);
    const args = [
      'lighthouse',
      `${BASE}${path}`,
      '--chrome-flags=--headless=new',
      `--only-categories=${CATEGORIES}`,
      '--output=json',
      `--output-path=${output}`,
      '--quiet',
      ...presetArgs,
    ];
    const result = spawnSync('npx', args, {
      cwd: root,
      shell: true,
      env: { ...process.env, CHROME_PATH: CHROME },
      encoding: 'utf8',
      timeout: 240_000,
    });
    if (result.status !== 0) {
      rows.push({
        pageName,
        presetName,
        error: (result.stderr || result.stdout || '').split('\n')[0],
      });
      continue;
    }
    const report = JSON.parse(readFileSync(output, 'utf8'));
    const score = (id) => Math.round((report.categories[id]?.score ?? 0) * 100);
    const value = (id) => report.audits[id]?.displayValue ?? report.audits[id]?.numericValue;
    rows.push({
      pageName,
      presetName,
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
      lcp: value('largest-contentful-paint'),
      cls: report.audits['cumulative-layout-shift']?.numericValue,
      tbt: value('total-blocking-time'),
      fcp: value('first-contentful-paint'),
      lighthouse: report.lighthouseVersion,
      chrome: report.environment.hostUserAgent.match(/(Edg|Chrome)\/[\d.]+/)?.[0] ?? 'desconocido',
    });
    console.log(`${pageName} [${presetName}] done`);
  }
}

const lines = [
  '# Resultados de Lighthouse',
  '',
  `Fecha de ejecución: ${new Date().toISOString()}. Medido sobre el build de producción (\`astro preview\`).`,
  '',
  '| Página | Dispositivo | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |',
  '|---|---|---|---|---|---|---|---|---|---|',
];
for (const row of rows) {
  if (row.error) {
    lines.push(`| ${row.pageName} | ${row.presetName} | error: ${row.error} | | | | | | | |`);
    continue;
  }
  lines.push(
    `| ${row.pageName} | ${row.presetName} | ${row.performance} | ${row.accessibility} | ${row.bestPractices} | ${row.seo} | ${row.lcp} | ${row.cls?.toFixed(3)} | ${row.tbt} | ${row.fcp} |`,
  );
}
const first = rows.find((row) => !row.error);
if (first) {
  lines.push(
    '',
    `Lighthouse ${first.lighthouse}, navegador ${first.chrome}. Los valores son los de la ejecución, sin redondeos manuales.`,
  );
}
lines.push(
  '',
  '**Limitaciones:** la medición de INP requiere interacciones del usuario y no se incluye en esta ejecución de carga. Los valores de móvil dependen de la emulación de Lighthouse (red y CPU limitadas), no de un dispositivo real.',
);
mkdirSync(join(root, 'docs', 'testing'), { recursive: true });
writeFileSync(join(root, 'docs', 'testing', 'lighthouse-results.md'), `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
