class DocumentPresenter {
  toPublic(document) {
    const { storedName, storagePath, ...publicDocument } = document;
    return publicDocument;
  }

  toPublicList(documents) {
    return documents.map((document) => this.toPublic(document));
  }
}

module.exports = DocumentPresenter;