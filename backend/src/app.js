const express = require('express');
const config = require('./config');
const DocumentController = require('./controllers/documentController');
const DocumentRepository = require('./repositories/documentRepository');
const FileRepository = require('./repositories/fileRepository');
const createDocumentRoutes = require('./routes/documentRoutes');
const DocumentService = require('./services/documentService');

function createApp() {
  const app = express();
  const documentRepository = new DocumentRepository();
  const fileRepository = new FileRepository(config.storageDir);
  const documentService = new DocumentService({ documentRepository, fileRepository });
  const documentController = new DocumentController(documentService);

  app.use(express.json());
  app.use(createDocumentRoutes({
    controller: documentController,
    fileRepository,
    maxFileSize: config.maxFileSize,
  }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.statusCode || 500;
    res.status(statusCode).json({
      error: statusCode === 413 ? 'Arquivo excede o limite permitido' : error.message,
    });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`DMS backend ouvindo na porta ${config.port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
