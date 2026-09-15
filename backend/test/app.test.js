const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { createApp } = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('o download aplica rate limiting por usuário', async (t) => {
  const isolatedApp = createApp();
  const server = isolatedApp.listen(0);
  const originalConsoleError = console.error;

  console.error = () => {};

  t.after(() => {
    console.error = originalConsoleError;
    server.close();
  });

  const { port } = server.address();
  const statuses = [];

  for (let index = 0; index < 31; index += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/documents/inexistente/download`, {
      headers: {
        'X-User-Id': 'rate-limit-test-user',
      },
    });

    statuses.push(response.status);
  }

  assert.ok(statuses.slice(0, 30).every((status) => status === 404));
  assert.strictEqual(statuses.at(-1), 429);
});
