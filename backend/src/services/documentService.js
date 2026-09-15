const crypto = require('node:crypto');

class DocumentService {
  constructor({ documentRepository, fileRepository }) {
    this.documentRepository = documentRepository;
    this.fileRepository = fileRepository;
  }

  async createDocument(file, owner) {
    if (!file) {
      const error = new Error('Arquivo é obrigatório');
      error.statusCode = 400;
      throw error;
    }

    if (!owner) {
      await this.fileRepository.remove(file.path);
      const error = new Error('Usuário é obrigatório');
      error.statusCode = 400;
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
      return this.toPublicDocument(document);
    } catch (error) {
      await this.fileRepository.remove(file.path);
      throw error;
    }
  }

  listDocuments(owner) {
    return this.documentRepository.findAll(owner).map((document) => this.toPublicDocument(document));
  }

  async getDownload(documentId, owner) {
    const document = this.documentRepository.findById(documentId);

    if (!document) {
      const error = new Error('Documento não encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (owner && document.owner !== owner) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    const filePath = this.fileRepository.resolveStoredPath(document.storedName);
    if (!(await this.fileRepository.exists(filePath))) {
      const error = new Error('Arquivo não encontrado');
      error.statusCode = 404;
      throw error;
    }

    return { document, filePath };
  }

  toPublicDocument(document) {
    const { storedName, storagePath, ...publicDocument } = document;
    return publicDocument;
  }
}

module.exports = DocumentService;
