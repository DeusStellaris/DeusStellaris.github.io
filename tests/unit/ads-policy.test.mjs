import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adsDecision, isValidPublisherId } from '../../src/features/ads/ads-policy.ts';

const VALID_PUB = 'ca-pub-1234567890123456';

test('con el interruptor apagado no se renderiza nada ni se carga nada', () => {
  assert.deepEqual(adsDecision({ enabled: false, publisherId: VALID_PUB, visitorGranted: true }), {
    renderSlots: false,
    loadScript: false,
  });
});

test('sin identificador de editor el script nunca se carga, aunque el visitante acepte', () => {
  assert.deepEqual(adsDecision({ enabled: true, publisherId: null, visitorGranted: true }), {
    renderSlots: true,
    loadScript: false,
  });
});

test('sin decisión positiva del visitante el script no se carga', () => {
  assert.deepEqual(adsDecision({ enabled: true, publisherId: VALID_PUB, visitorGranted: false }), {
    renderSlots: true,
    loadScript: false,
  });
});

test('solo con interruptor, identificador válido y decisión positiva se carga el script', () => {
  assert.deepEqual(adsDecision({ enabled: true, publisherId: VALID_PUB, visitorGranted: true }), {
    renderSlots: true,
    loadScript: true,
  });
});

test('los identificadores con formato incorrecto se rechazan', () => {
  assert.equal(isValidPublisherId('ca-pub-123'), false);
  assert.equal(isValidPublisherId('pub-1234567890123456'), false);
  assert.equal(isValidPublisherId('ca-pub-1234567890123456;alert(1)'), false);
  assert.equal(isValidPublisherId(null), false);
  assert.equal(isValidPublisherId(VALID_PUB), true);
});
