function createAuthenticate(authService) {
  return (req, res, next) => {
    const authorization = req.get('Authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acesso é obrigatório' });
    }

    try {
      req.user = authService.verifyToken(authorization.slice('Bearer '.length));
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Token de acesso inválido ou expirado' });
    }
  };
}

module.exports = createAuthenticate;