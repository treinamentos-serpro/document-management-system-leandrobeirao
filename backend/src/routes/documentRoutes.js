const express = require('express');
const multer = require('multer');
const path = require('node:path');

function createDocumentRoutes({ controller, fileRepository, maxFileSize }) {
  const router = express.Router();
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
        callback(null, `${require('node:crypto').randomUUID()}${extension}`);
      },
    }),
    limits: { fileSize: maxFileSize },
  });

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = createDocumentRoutes;
