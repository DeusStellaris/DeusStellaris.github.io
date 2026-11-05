import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countPending, parseLegalText } from '../../src/legal/segments.ts';

const EMPTY = { controllerName: null, email: null };
const FILLED = { controllerName: 'Titular de prueba', email: 'contacto@ejemplo.invalid' };

test('un marcador PENDING se muestra visible y etiquetado en español', () => {
  assert.deepEqual(parseLegalText('Base: {{PENDING:legal basis}}.', EMPTY, 'es'), [
    { type: 'text', value: 'Base: ' },
    { type: 'pending', value: '[PENDIENTE: legal basis]' },
    { type: 'text', value: '.' },
  ]);
});

test('un marcador PENDING se etiqueta en inglés con la versión inglesa', () => {
  const [pending] = parseLegalText('{{PENDING:legal basis}}', EMPTY, 'en');
  assert.equal(pending.value, '[PENDING: legal basis]');
});

test('sin nombre del responsable el marcador queda pendiente, nunca vacío', () => {
  const segments = parseLegalText('Responsable: {{CONTROLLER}}', EMPTY, 'es');
  assert.equal(segments[1].type, 'pending');
  assert.match(segments[1].value, /PENDIENTE/);
});

test('con datos confirmados el responsable y el correo se muestran como valor', () => {
  const segments = parseLegalText('{{CONTROLLER}} · {{EMAIL}}', FILLED, 'es');
  assert.deepEqual(
    segments.filter((s) => s.type === 'value').map((s) => s.value),
    ['Titular de prueba', 'contacto@ejemplo.invalid'],
  );
  assert.equal(countPending('{{CONTROLLER}} · {{EMAIL}}', FILLED, 'es'), 0);
});

test('un texto sin marcadores se devuelve íntegro', () => {
  assert.deepEqual(parseLegalText('Texto simple.', EMPTY, 'es'), [
    { type: 'text', value: 'Texto simple.' },
  ]);
});

test('countPending cuenta los marcadores que faltan por confirmar', () => {
  assert.equal(countPending('{{PENDING:a}} y {{PENDING:b}} y {{CONTROLLER}}', EMPTY, 'es'), 3);
});
