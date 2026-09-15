const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const DocumentService = require('../src/services/documentService');
const DocumentRepository = require('../src/repositories/documentRepository');
const FileRepository = require('../src/repositories/fileRepository');

test('DocumentService cria documento com sucesso', async (t) => {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-docs-'));
  t.after(async () => {
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  const documentRepository = new DocumentRepository();
  const fileRepository = new FileRepository(storageDir);
  const service = new DocumentService({ documentRepository, fileRepository });

  const uploadedFile = {
    originalname: 'relatorio.pdf',
    size: 2048,
    filename: 'abc123.pdf',
    path: path.join(storageDir, 'abc123.pdf'),
  };

  await fs.writeFile(uploadedFile.path, 'conteudo de teste');

  const document = await service.createDocument(uploadedFile, 'user-1');

  assert.strictEqual(document.originalName, 'relatorio.pdf');
  assert.strictEqual(document.owner, 'user-1');
  assert.strictEqual(document.size, 2048);
  assert.ok(document.id);
  assert.strictEqual(document.storedName, undefined);
  assert.strictEqual(document.storagePath, undefined);
  assert.strictEqual(documentRepository.findAll('user-1').length, 1);
});

test('DocumentService rejeita criação sem usuário e remove o arquivo', async (t) => {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-docs-'));
  t.after(async () => {
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  const documentRepository = new DocumentRepository();
  const fileRepository = new FileRepository(storageDir);
  const service = new DocumentService({ documentRepository, fileRepository });

  const uploadedFile = {
    originalname: 'falha.txt',
    size: 32,
    filename: 'falha.txt',
    path: path.join(storageDir, 'falha.txt'),
  };

  await fs.writeFile(uploadedFile.path, 'arquivo temporario');

  await assert.rejects(() => service.createDocument(uploadedFile, null), {
    name: 'Error',
    message: 'Usuário é obrigatório',
  });

  await assert.rejects(() => fs.access(uploadedFile.path), { code: 'ENOENT' });
  assert.strictEqual(documentRepository.findAll().length, 0);
});
