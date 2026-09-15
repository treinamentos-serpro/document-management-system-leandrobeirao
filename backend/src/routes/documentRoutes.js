const express = require('express');
const multer = require('multer');
const crypto = require('node:crypto');
const path = require('node:path');

function createRateLimiter({ windowMs, maxRequests }) {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.get('X-User-Id') || req.ip || 'anonymous';
    const now = Date.now();
    const entry = requests.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
      requests.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
      return;
    }

    entry.count += 1;
    next();
  };
}

function createDocumentRoutes({ controller, fileRepository, maxFileSize }) {
  const router = express.Router();
  const downloadRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 30 });
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
    limits: { fileSize: maxFileSize, files: 1, fields: 1 },
  });

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', downloadRateLimiter, controller.download);

  return router;
}

module.exports = createDocumentRoutes;
