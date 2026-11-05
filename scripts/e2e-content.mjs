// Ejecuta las pruebas de contenido (proyectos, favoritos, colaboradores, borradores) con fixtures.
//
// Los fixtures de tests/fixtures/content se copian a src/content solo durante la ejecución, se compila
// el sitio, se ejecuta tests/e2e/content.spec.mjs y, pase lo que pase, las copias se eliminan y el sitio
// se recompila sin ellas. El repositorio nunca conserva contenido de prueba.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const fixtures = join(root, 'tests', 'fixtures', 'content');
const target = join(root, 'src', 'content');

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  return result.status ?? 1;
}

const copied = [];
let status = 1;
try {
  for (const file of listFiles(fixtures)) {
    const destination = join(target, relative(fixtures, file));
    if (existsSync(destination))
      throw new Error(`No se sobrescribe contenido existente: ${destination}`);
    cpSync(file, destination);
    copied.push(destination);
  }
  console.log(`Fixtures copiados: ${copied.length}`);

  if (run('npx', ['astro', 'build']) !== 0) throw new Error('El build con fixtures falló');
  status = run('npx', ['playwright', 'test', 'tests/e2e/content.spec.mjs'], { E2E_CONTENT: '1' });
} catch (error) {
  console.error(error.message);
} finally {
  for (const file of copied) rmSync(file, { force: true });
  console.log(`Fixtures eliminados: ${copied.length}`);
  run('npx', ['astro', 'build']);
}

process.exit(status);
