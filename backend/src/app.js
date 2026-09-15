const express = require('express');
const config = require('./config');
const AuthController = require('./controllers/authController');
const DocumentController = require('./controllers/documentController');
const DocumentRepository = require('./repositories/documentRepository');
const FileRepository = require('./repositories/fileRepository');
const UserRepository = require('./repositories/userRepository');
const createAuthenticate = require('./middlewares/authenticate');
const createAuthRoutes = require('./routes/authRoutes');
const createDocumentRoutes = require('./routes/documentRoutes');
const AuthService = require('./services/authService');
const DocumentService = require('./services/documentService');

function createApp() {
  const app = express();
  const documentRepository = new DocumentRepository();
  const fileRepository = new FileRepository(config.storageDir);
  const userRepository = new UserRepository();
  const authService = new AuthService({
    userRepository,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
  });
  const documentService = new DocumentService({ documentRepository, fileRepository });
  const authController = new AuthController(authService);
  const documentController = new DocumentController(documentService);
  const authenticate = createAuthenticate(authService);

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use(createAuthRoutes(authController));
  app.use(createDocumentRoutes({
    controller: documentController,
    fileRepository,
    maxFileSize: config.maxFileSize,
    authenticate,
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
