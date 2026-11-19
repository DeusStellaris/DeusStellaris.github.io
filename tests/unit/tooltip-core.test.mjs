import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tooltipFlipsUp, tooltipShift } from '../../src/features/tooltips/tooltip-core.ts';

test('tooltipShift mantiene el cuadro dentro del viewport con 12 px de margen', () => {
  assert.equal(tooltipShift(243, 288, 360), 57);
  assert.equal(tooltipShift(300, 200, 360), 0);
  assert.equal(tooltipShift(355, 100, 360), -7);
  assert.equal(tooltipShift(400, 288, 1440), 0);
});

test('tooltipFlipsUp solo sube si no cabe debajo y sí arriba', () => {
  assert.equal(tooltipFlipsUp(60, 20, 80, 844), false);
  assert.equal(tooltipFlipsUp(800, 756, 80, 844), true);
  assert.equal(tooltipFlipsUp(40, 0, 900, 844), false);
});
