const express = require('express');
const { ipKeyGenerator, rateLimit } = require('express-rate-limit');
const multer = require('multer');
const crypto = require('node:crypto');
const path = require('node:path');

function createRateLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
    handler: (req, res) => {
      res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
    },
  });
}

function createDocumentRoutes({ controller, fileRepository, maxFileSize, authenticate }) {
  const router = express.Router();
  const uploadRateLimiter = createRateLimiter({ windowMs: 60 * 1000, limit: 10 });
  const downloadRateLimiter = createRateLimiter({ windowMs: 60 * 1000, limit: 30 });
  const upload = multer({
    storage: multer.diskStorage({
      destination: async (req, file, callback) => {
        try {
          await fileRepository.ensureStorageDirectory();
          callback(null, fileRepository.storageDir);
        } catch (error) {
          callback(error);
        }
      },
      filename: (req, file, callback) => {
        const extension = path.extname(file.originalname);
        callback(null, `${crypto.randomUUID()}${extension}`);
      },
    }),
    limits: { fileSize: maxFileSize, files: 1 },
  });

  router.use(authenticate);
  router.post('/upload', uploadRateLimiter, upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', downloadRateLimiter, controller.download);

  return router;
}

module.exports = createDocumentRoutes;
