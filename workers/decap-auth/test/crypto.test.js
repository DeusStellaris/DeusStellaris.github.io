import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  base64url,
  constantTimeEqual,
  importStateKey,
  openState,
  pkceChallenge,
  randomBase64url,
  sealState,
} from '../src/crypto.js';

function randomKeyBase64() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64');
}

test('PKCE S256 coincide con el vector oficial de la RFC 7636 (apéndice B)', async () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  assert.equal(await pkceChallenge(verifier), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('base64url no produce +, / ni relleno', () => {
  const encoded = base64url(new Uint8Array([251, 255, 191, 0, 1]));
  assert.doesNotMatch(encoded, /[+/=]/);
});

test('randomBase64url genera valores distintos y de longitud esperada', () => {
  const a = randomBase64url(32);
  const b = randomBase64url(32);
  assert.notEqual(a, b);
  assert.equal(a.length, 43);
});

test('sealState y openState hacen ida y vuelta con la clave correcta', async () => {
  const key = await importStateKey(randomKeyBase64());
  const payload = { s: 'estado', v: 'verificador', a: 'production', t: 1700000000 };
  const sealed = await sealState(key, payload);
  assert.deepEqual(await openState(key, sealed), payload);
});

test('openState rechaza un token alterado', async () => {
  const key = await importStateKey(randomKeyBase64());
  const sealed = await sealState(key, { s: 'x' });
  const tampered = sealed.slice(0, -2) + (sealed.endsWith('A') ? 'B' : 'A');
  assert.equal(await openState(key, tampered), null);
});

test('openState rechaza un token cifrado con otra clave', async () => {
  const keyA = await importStateKey(randomKeyBase64());
  const keyB = await importStateKey(randomKeyBase64());
  const sealed = await sealState(keyA, { s: 'x' });
  assert.equal(await openState(keyB, sealed), null);
});

test('openState devuelve null para entradas basura sin lanzar', async () => {
  const key = await importStateKey(randomKeyBase64());
  assert.equal(await openState(key, ''), null);
  assert.equal(await openState(key, '%%%'), null);
  assert.equal(await openState(key, 'AAAA'), null);
});

test('importStateKey exige exactamente 32 bytes', async () => {
  const short = Buffer.from(new Uint8Array(16)).toString('base64');
  await assert.rejects(importStateKey(short), /32 bytes/);
});

test('importStateKey falla si la clave no está configurada', async () => {
  await assert.rejects(importStateKey(undefined), /no está configurada/);
  await assert.rejects(importStateKey(''), /no está configurada/);
});

test('constantTimeEqual distingue cadenas iguales, distintas y de longitud diferente', () => {
  assert.equal(constantTimeEqual('abc', 'abc'), true);
  assert.equal(constantTimeEqual('abc', 'abd'), false);
  assert.equal(constantTimeEqual('abc', 'abcd'), false);
});
