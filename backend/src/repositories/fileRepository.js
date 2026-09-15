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
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  resolveStoredPath(storedName) {
    const resolvedPath = path.resolve(this.storageDir, storedName);
    const storagePrefix = `${path.resolve(this.storageDir)}${path.sep}`;

    if (!resolvedPath.startsWith(storagePrefix)) {
      throw new Error('Caminho de arquivo inválido');
    }

    return resolvedPath;
  }
}

module.exports = FileRepository;
