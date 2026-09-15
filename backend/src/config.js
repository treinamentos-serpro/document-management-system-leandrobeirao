const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function positiveNumber(value, fallback, name) {
  const number = Number(value ?? fallback);

  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo`);
  }

  return number;
}

module.exports = {
  port: positiveNumber(process.env.PORT, 3000, 'PORT'),
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.join(projectRoot, 'storage'),
  maxFileSize: positiveNumber(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024, 'MAX_FILE_SIZE'),
};
