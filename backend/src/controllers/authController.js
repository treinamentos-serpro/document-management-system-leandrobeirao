class AuthController {
  constructor(authService) {
    this.authService = authService;
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  async register(req, res, next) {
    try {
      const session = await this.authService.register(req.body.username, req.body.password);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const session = await this.authService.login(req.body.username, req.body.password);
      res.json(session);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;