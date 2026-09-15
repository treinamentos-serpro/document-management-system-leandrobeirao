const { test } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const testStorageDir = path.join(os.tmpdir(), `dms-http-${process.pid}-${crypto.randomUUID()}`);
process.env.STORAGE_DIR = testStorageDir;
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';

const app = require('../src/app');
const { createApp } = require('../src/app');

async function registerUser(baseUrl, username) {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'password-123' }),
  });
  const session = await response.json();

  assert.strictEqual(response.status, 201);
  return session;
}

function authorization(token) {
  return { Authorization: `Bearer ${token}` };
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('rotas de documentos exigem autenticação', async (t) => {
  const isolatedApp = createApp();
  const server = isolatedApp.listen(0);

  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/documents`);

  assert.strictEqual(response.status, 401);
  assert.deepStrictEqual(await response.json(), { error: 'Token de acesso é obrigatório' });
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
  const session = await registerUser(baseUrl, 'endpoint-test-user');
  const fileContent = 'conteúdo do documento de teste';
  const formData = new FormData();
  formData.append('file', new Blob([fileContent], { type: 'text/plain' }), 'documento.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authorization(session.token),
    body: formData,
  });
  const uploadedDocument = await uploadResponse.json();

  assert.strictEqual(uploadResponse.status, 201);
  assert.strictEqual(uploadedDocument.originalName, 'documento.txt');
  assert.strictEqual(uploadedDocument.owner, session.user.id);
  assert.ok(uploadedDocument.id);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: authorization(session.token),
  });
  const documents = await listResponse.json();

  assert.strictEqual(listResponse.status, 200);
  assert.strictEqual(documents.length, 1);
  assert.strictEqual(documents[0].id, uploadedDocument.id);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
    { headers: authorization(session.token) },
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
  const baseUrl = `http://127.0.0.1:${port}`;
  const session = await registerUser(baseUrl, 'rate-limit-test-user');
  const statuses = [];

  for (let index = 0; index < 31; index += 1) {
    const response = await fetch(`${baseUrl}/documents/inexistente/download`, {
      headers: authorization(session.token),
    });

    statuses.push(response.status);
  }

  assert.ok(statuses.slice(0, 30).every((status) => status === 404));
  assert.strictEqual(statuses.at(-1), 429);
});

test('cada usuário vê e acessa apenas seus documentos', async (t) => {
  const isolatedApp = createApp();
  const server = isolatedApp.listen(0);
  const originalConsoleError = console.error;

  console.error = () => {};

  t.after(() => {
    console.error = originalConsoleError;
    server.close();
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const ownerSession = await registerUser(baseUrl, 'document-owner');
  const otherSession = await registerUser(baseUrl, 'other-user');
  const formData = new FormData();
  formData.append('file', new Blob(['privado']), 'privado.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authorization(ownerSession.token),
    body: formData,
  });
  const document = await uploadResponse.json();
  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: authorization(otherSession.token),
  });
  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: authorization(otherSession.token),
  });

  assert.strictEqual(uploadResponse.status, 201);
  assert.deepStrictEqual(await listResponse.json(), []);
  assert.strictEqual(downloadResponse.status, 403);
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
  const baseUrl = `http://127.0.0.1:${port}`;
  const session = await registerUser(baseUrl, 'upload-rate-limit-test-user');
  const statuses = [];

  for (let index = 0; index < 11; index += 1) {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: authorization(session.token),
    });

    statuses.push(response.status);
  }

  assert.ok(statuses.slice(0, 10).every((status) => status === 400));
  assert.strictEqual(statuses.at(-1), 429);
});
