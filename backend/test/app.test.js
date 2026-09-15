const { test } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const testStorageDir = path.join(os.tmpdir(), `dms-http-${process.pid}-${crypto.randomUUID()}`);
process.env.STORAGE_DIR = testStorageDir;

const app = require('../src/app');
const { createApp } = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download funcionam em conjunto', async (t) => {
  const isolatedApp = createApp();
  const server = isolatedApp.listen(0);

  t.after(async () => {
    server.close();
    await fs.rm(testStorageDir, { recursive: true, force: true });
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const userId = 'endpoint-test-user';
  const fileContent = 'conteúdo do documento de teste';
  const formData = new FormData();
  formData.append('file', new Blob([fileContent], { type: 'text/plain' }), 'documento.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: formData,
  });
  const uploadedDocument = await uploadResponse.json();

  assert.strictEqual(uploadResponse.status, 201);
  assert.strictEqual(uploadedDocument.originalName, 'documento.txt');
  assert.strictEqual(uploadedDocument.owner, userId);
  assert.ok(uploadedDocument.id);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': userId },
  });
  const documents = await listResponse.json();

  assert.strictEqual(listResponse.status, 200);
  assert.strictEqual(documents.length, 1);
  assert.strictEqual(documents[0].id, uploadedDocument.id);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
    { headers: { 'X-User-Id': userId } },
  );

  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /documento\.txt/);
  assert.strictEqual(await downloadResponse.text(), fileContent);
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

test('o download aplica rate limiting por IP quando não há usuário', async (t) => {
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
    const response = await fetch(`http://127.0.0.1:${port}/documents/inexistente/download`);
    statuses.push(response.status);
  }

  assert.ok(statuses.slice(0, 30).every((status) => status === 404));
  assert.strictEqual(statuses.at(-1), 429);
});

test('o upload aplica rate limiting por usuário', async (t) => {
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

  for (let index = 0; index < 11; index += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/upload`, {
      method: 'POST',
      headers: {
        'X-User-Id': 'upload-rate-limit-test-user',
      },
    });

    statuses.push(response.status);
  }

  assert.ok(statuses.slice(0, 10).every((status) => status === 400));
  assert.strictEqual(statuses.at(-1), 429);
});
