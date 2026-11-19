// Ejecuta las pruebas que necesitan contenido o configuración de prueba, en dos etapas.
//
// Etapa 1 (contenido): los fixtures de tests/fixtures/content se copian a src/content, se compila el
// sitio y se ejecuta tests/e2e/content.spec.mjs.
// Etapa 2 (demos): se reemplazan temporalmente src/config/demos.json y src/config/services.json por
// los de tests/fixtures/config, se añade la demo de tests/fixtures/public y se ejecuta
// tests/e2e/demos.spec.mjs. La API es simulada por la propia prueba.
//
// Pase lo que pase, todo se restaura y el sitio se recompila sin fixtures: el repositorio nunca
// conserva contenido ni configuración de prueba.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const fixtures = join(root, 'tests', 'fixtures');

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

/** Copia archivos nuevos (nunca sobrescribe) y devuelve cómo deshacerlo. */
function addFiles(sourceDir, targetDir) {
  const added = [];
  for (const file of listFiles(sourceDir)) {
    const destination = join(targetDir, relative(sourceDir, file));
    if (existsSync(destination)) throw new Error(`No se sobrescribe: ${destination}`);
    cpSync(file, destination);
    added.push(destination);
  }
  return () => {
    for (const file of added) rmSync(file, { force: true });
    rmSync(join(root, 'public', 'demos', 'demo-test'), { recursive: true, force: true });
  };
}

/** Reemplaza archivos existentes y devuelve cómo restaurarlos. */
function overrideFiles(sourceDir, targetDir) {
  const originals = [];
  for (const file of listFiles(sourceDir)) {
    const destination = join(targetDir, relative(sourceDir, file));
    originals.push({ destination, original: readFileSync(destination) });
    cpSync(file, destination);
  }
  return () => {
    for (const { destination, original } of originals) writeFileSync(destination, original);
  };
}

/** Ejecuta una etapa con sus fixtures y los deshace siempre. */
function stage(name, setup, specs, env = {}) {
  let undo = () => {};
  try {
    undo = setup();
    console.log(`Etapa: ${name}`);
    if (run('npx', ['astro', 'build']) !== 0) throw new Error(`El build de "${name}" falló`);
    return run('npx', ['playwright', 'test', ...specs], env);
  } catch (error) {
    console.error(error.message);
    return 1;
  } finally {
    undo();
  }
}

const contentStatus = stage(
  'contenido',
  () => addFiles(join(fixtures, 'content'), join(root, 'src', 'content')),
  ['tests/e2e/content.spec.mjs'],
  { E2E_CONTENT: '1' },
);

const demosStatus = stage(
  'demos',
  () => {
    const restore = overrideFiles(join(fixtures, 'config'), join(root, 'src', 'config'));
    const remove = addFiles(join(fixtures, 'public'), join(root, 'public'));
    return () => {
      remove();
      restore();
    };
  },
  ['tests/e2e/demos.spec.mjs'],
  { E2E_CONTENT: '1' },
);

run('npx', ['astro', 'build']);
process.exit(contentStatus === 0 && demosStatus === 0 ? 0 : 1);
