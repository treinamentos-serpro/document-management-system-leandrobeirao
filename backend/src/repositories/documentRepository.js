class DocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  save(document) {
    this.documents.set(document.id, document);
    return document;
  }

  findAll(owner) {
    const documents = [...this.documents.values()];
    return owner ? documents.filter((document) => document.owner === owner) : documents;
  }

  findById(id) {
    return this.documents.get(id);
  }
}

module.exports = DocumentRepository;
