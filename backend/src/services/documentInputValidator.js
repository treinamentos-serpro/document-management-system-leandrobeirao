class DocumentInputValidator {
  validateFile(file) {
    if (!file) {
      const error = new Error('Arquivo é obrigatório');
      error.statusCode = 400;
      throw error;
    }
  }

  validateOwner(owner) {
    if (!owner) {
      const error = new Error('Usuário é obrigatório');
      error.statusCode = 400;
      throw error;
    }
  }
}

module.exports = DocumentInputValidator;