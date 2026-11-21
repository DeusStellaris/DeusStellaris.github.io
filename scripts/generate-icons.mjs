// Genera el favicon y los íconos de la PWA a partir del emblema original de Deus.
// El original pesado vive fuera del repo (_Deus_Assets); aquí solo se escriben los derivados.
// Uso: npm run icons [ruta-al-original.png]
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE =
  process.argv[2] ??
  join(homedir(), 'Documents', 'Deus_Workspace', '_Deus_Assets', 'brand-sources', 'Samurai Morado.png');
const OUT = new URL('../public/', import.meta.url);
const ICONS = new URL('assets/icons/', OUT);
mkdirSync(ICONS, { recursive: true });

// Recorte cuadrado centrado en el casco: así la silueta ocupa casi todo el lienzo.
const CROP = { left: 150, top: 120, width: 2290, height: 2290 };
const emblem = () => sharp(SOURCE).extract(CROP);

// Para tamaños de pestaña, un recorte más cerrado agranda la silueta.
const TIGHT = { left: 300, top: 200, width: 1960, height: 1960 };

const png = (size, options = {}) =>
  (options.tight ? sharp(SOURCE).extract(TIGHT) : emblem())
    .resize(size, size, { kernel: 'lanczos3' })
    .sharpen(options.sharpen ?? { sigma: 0.6 })
    .png({ compressionLevel: 9, palette: size <= 64 });

async function write(path, pipeline) {
  const buffer = await pipeline.toBuffer();
  writeFileSync(new URL(path, ICONS), buffer);
  return buffer;
}

await write('icon-192.png', png(192));
await write('icon-512.png', png(512));
await write('apple-touch-icon.png', png(180));
await write('favicon-16.png', png(16, { tight: true, sharpen: { sigma: 0.5, m1: 1.5 } }));
await write('favicon-32.png', png(32, { tight: true, sharpen: { sigma: 0.5, m1: 1.5 } }));

// Maskable: el emblema ocupa el 70 % central (zona segura) sobre su propio fondo desenfocado.
const inner = 358;
const pad = (512 - inner) / 2;
const backdrop = await emblem().resize(512, 512).blur(40).toBuffer();
const centered = await emblem().resize(inner, inner, { kernel: 'lanczos3' }).toBuffer();
await write(
  'icon-maskable-512.png',
  sharp(backdrop)
    .composite([{ input: centered, left: pad, top: pad }])
    .png({ compressionLevel: 9 }),
);

// favicon.svg: el emblema de 64 px incrustado, con esquinas suaves; se ve igual en pestañas claras y oscuras.
const small = await png(64, { tight: true }).toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Deus">
  <clipPath id="c"><rect width="64" height="64" rx="12"/></clipPath>
  <image clip-path="url(#c)" width="64" height="64" href="data:image/png;base64,${small.toString('base64')}"/>
</svg>
`;
writeFileSync(new URL('favicon.svg', OUT), svg);
console.log('Íconos generados en public/.');
