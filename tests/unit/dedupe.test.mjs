import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dedupe, forget } from '../../src/lib/dedupe.ts';

test('llamadas iguales comparten una sola carga', async () => {
  let calls = 0;
  const load = async () => ++calls;
  const [a, b] = await Promise.all([dedupe('k1', load), dedupe('k1', load)]);
  assert.equal(a, b);
  assert.equal(calls, 1);
});

test('forget y los fallos permiten una carga nueva', async () => {
  let calls = 0;
  await dedupe('k2', async () => ++calls);
  forget('k2');
  await dedupe('k2', async () => ++calls);
  assert.equal(calls, 2);
  await assert.rejects(dedupe('k3', async () => Promise.reject(new Error('x'))));
  assert.equal(await dedupe('k3', async () => 'ok'), 'ok');
});

test('la ventana vencida vuelve a cargar', async () => {
  let calls = 0;
  await dedupe('k4', async () => ++calls, 0);
  await dedupe('k4', async () => ++calls, 0);
  assert.equal(calls, 2);
});
