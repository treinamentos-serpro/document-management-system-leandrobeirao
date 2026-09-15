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

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  app.use(express.json({ limit: '100kb' }));
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

    const statusCode = error.code === 'LIMIT_FILE_SIZE'
      ? 413
      : error.statusCode || 500;
    const publicMessage = statusCode >= 500
      ? 'Erro interno do servidor'
      : error.message;

    console.error(error);
    res.status(statusCode).json({
      error: statusCode === 413 ? 'Arquivo excede o limite permitido' : publicMessage,
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
