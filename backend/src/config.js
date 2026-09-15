const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function positiveNumber(value, fallback, name) {
  const number = Number(value ?? fallback);

  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo`);
  }

  return number;
}

function portNumber(value, fallback) {
  const port = Number(value ?? fallback);

  if (!Number.isSafeInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT deve estar entre 0 e 65535');
  }

  return port;
}

module.exports = {
  port: portNumber(process.env.PORT, 3000),
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.join(projectRoot, 'storage'),
  maxFileSize: positiveNumber(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024, 'MAX_FILE_SIZE'),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};
