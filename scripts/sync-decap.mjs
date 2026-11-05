// Copia el bundle de Decap CMS de la versión fijada en package.json a public/admin/vendor/.
// Así /admin no necesita cargar scripts de un CDN (la CSP de /admin queda en 'self').
// Se excluyen los .map (no se publican source maps) y se registran los hashes SHA-384.
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const pinned = pkg.devDependencies['decap-cms-app'];
if (!pinned || /[\^~<>*]/.test(pinned)) {
  throw new Error(`decap-cms-app debe estar fijado a una versión exacta. Valor actual: ${pinned}`);
}

const source = join(root, 'node_modules', 'decap-cms-app', 'dist');
if (!existsSync(source)) {
  throw new Error('No se encuentra node_modules/decap-cms-app/dist. Ejecuta npm install.');
}

const target = join(root, 'public', 'admin', 'vendor');
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

const files = readdirSync(source).filter((name) => name.endsWith('.js'));
const hashes = [];
for (const name of files) {
  copyFileSync(join(source, name), join(target, name));
  const digest = createHash('sha384')
    .update(readFileSync(join(source, name)))
    .digest('base64');
  hashes.push(`${name} sha384-${digest}`);
}

writeFileSync(join(target, 'SHA384SUMS.txt'), `${hashes.join('\n')}\n`);
console.log(
  `Decap CMS ${pinned}: ${files.length} archivos copiados a public/admin/vendor/ (sin .map).`,
);
