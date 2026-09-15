const fs = require('node:fs/promises');
const path = require('node:path');

class FileRepository {
  constructor(storageDir) {
    this.storageDir = storageDir;
  }

  async ensureStorageDirectory() {
    await fs.mkdir(this.storageDir, { recursive: true });
  }

  async remove(filePath) {
    await fs.rm(filePath, { force: true });
  }

  async exists(filePath) {
    try {
      const fileStats = await fs.stat(filePath);
      return fileStats.isFile();
    } catch {
      return false;
    }
  }

  async resolveStoredPath(storedName) {
    if (!storedName || path.basename(storedName) !== storedName) {
      const error = new Error('Arquivo não encontrado');
      error.statusCode = 404;
      throw error;
    }

    const resolvedPath = path.resolve(this.storageDir, storedName);
    const storagePrefix = `${path.resolve(this.storageDir)}${path.sep}`;

    if (!resolvedPath.startsWith(storagePrefix)) {
      const error = new Error('Arquivo não encontrado');
      error.statusCode = 404;
      throw error;
    }

    return resolvedPath;
  }
}

module.exports = FileRepository;
