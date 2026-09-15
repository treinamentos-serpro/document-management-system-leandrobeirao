class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
    this.upload = this.upload.bind(this);
    this.list = this.list.bind(this);
    this.download = this.download.bind(this);
  }

  async upload(req, res, next) {
    try {
      const document = await this.documentService.createDocument(req.file, req.user.id);
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }

  list(req, res) {
    res.json(this.documentService.listDocuments(req.user.id));
  }

  async download(req, res, next) {
    try {
      const { document, filePath } = await this.documentService.getDownload(
        req.params.id,
        req.user.id,
      );
      res.download(filePath, document.originalName, (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentController;
