const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

module.exports = {
  port: Number(process.env.PORT || 3000),
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.join(projectRoot, 'storage'),
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024),
};
