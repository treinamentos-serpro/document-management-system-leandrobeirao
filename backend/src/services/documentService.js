const crypto = require('node:crypto');
const DocumentInputValidator = require('./documentInputValidator');
const DocumentPresenter = require('./documentPresenter');

class DocumentService {
  constructor({
    documentRepository,
    fileRepository,
    inputValidator = new DocumentInputValidator(),
    presenter = new DocumentPresenter(),
  }) {
    this.documentRepository = documentRepository;
    this.fileRepository = fileRepository;
    this.inputValidator = inputValidator;
    this.presenter = presenter;
  }

  async createDocument(file, owner) {
    this.inputValidator.validateFile(file);

    try {
      this.inputValidator.validateOwner(owner);
    } catch (error) {
      await this.fileRepository.remove(file.path);
      throw error;
    }

    const document = {
      id: crypto.randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      storedName: file.filename,
      storagePath: file.path,
    };

    try {
      this.documentRepository.save(document);
      return this.presenter.toPublic(document);
    } catch (error) {
      await this.fileRepository.remove(file.path);
      throw error;
    }
  }

  listDocuments(owner) {
    return this.presenter.toPublicList(this.documentRepository.findAll(owner));
  }

  async getDownload(documentId, owner) {
    const document = this.documentRepository.findById(documentId);

    if (!document) {
      const error = new Error('Documento não encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (document.owner !== owner) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    const filePath = await this.fileRepository.resolveStoredPath(document.storedName);
    if (!(await this.fileRepository.exists(filePath))) {
      const error = new Error('Arquivo não encontrado');
      error.statusCode = 404;
      throw error;
    }

    return { document, filePath };
  }
}

module.exports = DocumentService;
