import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeCls,
  normalizePath,
  rateVital,
  shouldSample,
} from '../../src/features/rum/rum-core.ts';

test('rateVital usa los umbrales de web.dev', () => {
  assert.equal(rateVital('LCP', 2500), 'good');
  assert.equal(rateVital('LCP', 3000), 'needs-improvement');
  assert.equal(rateVital('INP', 501), 'poor');
  assert.equal(rateVital('CLS', 0.05), 'good');
});

test('normalizePath quita la base y los caracteres no admitidos por la API', () => {
  assert.equal(normalizePath('/Portafolio/juegos/', '/Portafolio'), '/juegos/');
  assert.equal(normalizePath('/', '/'), '/');
  assert.equal(normalizePath('/a b/', '/'), '/ab/');
});

test('computeCls agrupa cambios en ventanas de sesión e ignora los de entrada del usuario', () => {
  const shifts = [
    { value: 0.05, startTime: 100, hadRecentInput: false },
    { value: 0.04, startTime: 600, hadRecentInput: false },
    { value: 0.5, startTime: 700, hadRecentInput: true },
    { value: 0.02, startTime: 9000, hadRecentInput: false },
  ];
  assert.ok(Math.abs(computeCls(shifts) - 0.09) < 1e-9);
  assert.equal(computeCls([]), 0);
});

test('shouldSample respeta muestreo, Do Not Track y ahorro de datos', () => {
  const base = { rate: 0.1, random: 0.05, doNotTrack: false, saveData: false };
  assert.equal(shouldSample(base), true);
  assert.equal(shouldSample({ ...base, random: 0.5 }), false);
  assert.equal(shouldSample({ ...base, doNotTrack: true }), false);
  assert.equal(shouldSample({ ...base, saveData: true }), false);
});
