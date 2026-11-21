import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tooltipPlacement } from '../../src/features/tooltips/tooltip-core.ts';

const viewport = { width: 360, height: 844 };
const size = { width: 200, height: 60 };
const box = (left, width, top = 100, height = 44) => ({
  left,
  right: left + width,
  top,
  bottom: top + height,
});

test('se centra bajo el control cuando cabe', () => {
  assert.deepEqual(tooltipPlacement(box(130, 100), size, viewport), { left: 80, top: 152 });
});

test('nunca se recorta a la izquierda ni a la derecha (margen de 12 px)', () => {
  assert.equal(tooltipPlacement(box(0, 40), size, viewport).left, 12);
  assert.equal(tooltipPlacement(box(330, 30), size, viewport).left, 148);
});

test('pasa arriba solo si no cabe debajo y sí arriba', () => {
  assert.equal(tooltipPlacement(box(100, 40, 780), size, viewport).top, 712);
  assert.equal(tooltipPlacement(box(100, 40, 20), size, viewport).top, 72);
});
