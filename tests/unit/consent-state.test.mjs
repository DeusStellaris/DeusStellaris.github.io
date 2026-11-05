import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  adsGranted,
  emptyRecord,
  markPending,
  markRegistered,
  needsBanner,
  parseConsentRecord,
  requiredChecksOk,
  setAdsDecision,
} from '../../src/features/consent/consent-state.ts';

const VERSIONS = { terms: '2026-11-05.1', privacy: '2026-11-05.1', cookies: '2026-11-05.1' };
const NOW = '2026-11-05T12:00:00.000Z';

test('un registro vacío requiere el aviso', () => {
  assert.equal(needsBanner(emptyRecord(), VERSIONS), true);
});

test('aceptar solo los términos no basta: falta la privacidad', () => {
  let record = markRegistered(emptyRecord(), 'terms', VERSIONS.terms, NOW);
  assert.equal(needsBanner(record, VERSIONS), true);
  record = markRegistered(record, 'privacy', VERSIONS.privacy, NOW);
  assert.equal(needsBanner(record, VERSIONS), false);
});

test('una aceptación pendiente de registro en el servidor mantiene el aviso', () => {
  let record = markPending(emptyRecord(), 'terms', VERSIONS.terms);
  record = markPending(record, 'privacy', VERSIONS.privacy);
  assert.equal(needsBanner(record, VERSIONS), true, 'pendiente no equivale a registrada');
});

test('una versión nueva del documento vuelve a pedir la aceptación', () => {
  let record = markRegistered(emptyRecord(), 'terms', VERSIONS.terms, NOW);
  record = markRegistered(record, 'privacy', VERSIONS.privacy, NOW);
  const newVersions = { ...VERSIONS, privacy: '2027-01-01.1' };
  assert.equal(needsBanner(record, newVersions), true);
});

test('las aceptaciones son independientes: la publicidad no cuenta como aceptación legal', () => {
  const record = setAdsDecision(emptyRecord(), true, NOW);
  assert.equal(needsBanner(record, VERSIONS), true);
  assert.equal(adsGranted(record), true);
});

test('la publicidad solo se considera concedida con decisión explícita y positiva', () => {
  assert.equal(adsGranted(emptyRecord()), false);
  assert.equal(adsGranted(setAdsDecision(emptyRecord(), false, NOW)), false);
});

test('un registro registrado exige hora del servidor', () => {
  const bad = {
    version: 1,
    legal: { terms: { version: '1', status: 'registered', acceptedAt: null } },
    ads: null,
  };
  assert.equal(parseConsentRecord(bad), null);
});

test('parseConsentRecord descarta valores corruptos sin lanzar', () => {
  assert.equal(parseConsentRecord(null), null);
  assert.equal(parseConsentRecord('texto'), null);
  assert.equal(parseConsentRecord({ version: 2, legal: {}, ads: null }), null);
  assert.equal(
    parseConsentRecord({
      version: 1,
      legal: { terms: { version: '../x', status: 'registered', acceptedAt: NOW } },
      ads: null,
    }),
    null,
  );
  assert.equal(
    parseConsentRecord({ version: 1, legal: {}, ads: { granted: 'si', decidedAt: NOW } }),
    null,
  );
  assert.equal(
    parseConsentRecord({ version: 1, legal: {}, ads: { granted: true, decidedAt: 'ayer' } }),
    null,
  );
});

test('un registro válido se reconstruye tal cual', () => {
  const record = setAdsDecision(
    markRegistered(emptyRecord(), 'terms', VERSIONS.terms, NOW),
    false,
    NOW,
  );
  assert.deepEqual(parseConsentRecord(JSON.parse(JSON.stringify(record))), record);
});

test('sin Supabase configurado no hay confirmación del servidor: la aceptación queda pendiente y el aviso sigue', () => {
  // Sin servidor no se llama a markRegistered: solo existe markPending con la versión vigente.
  let record = emptyRecord();
  record = markPending(record, 'terms', VERSIONS.terms);
  record = markPending(record, 'privacy', VERSIONS.privacy);
  assert.equal(record.legal.terms.status, 'pending');
  assert.equal(record.legal.terms.acceptedAt, null, 'nunca una hora inventada por el cliente');
  assert.equal(needsBanner(record, VERSIONS), true);
});

test('un estado pendiente con hora falsa sigue siendo pendiente: exige el aviso', () => {
  const forged = {
    version: 1,
    legal: {
      terms: { version: VERSIONS.terms, status: 'pending', acceptedAt: NOW },
      privacy: { version: VERSIONS.privacy, status: 'registered', acceptedAt: NOW },
    },
    ads: null,
  };
  const parsed = parseConsentRecord(forged);
  assert.notEqual(parsed, null);
  assert.equal(parsed.legal.terms.status, 'pending');
  assert.equal(needsBanner(parsed, VERSIONS), true, 'solo el estado registrado evita el aviso');
});

test('las casillas obligatorias deben estar ambas marcadas', () => {
  assert.equal(requiredChecksOk(true, true), true);
  assert.equal(requiredChecksOk(true, false), false);
  assert.equal(requiredChecksOk(false, true), false);
  assert.equal(requiredChecksOk(false, false), false);
});
