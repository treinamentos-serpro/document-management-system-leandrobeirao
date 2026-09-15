const crypto = require('node:crypto');
const { promisify } = require('node:util');
const jwt = require('jsonwebtoken');

const scrypt = promisify(crypto.scrypt);

class AuthService {
  constructor({ userRepository, jwtSecret, jwtExpiresIn }) {
    if (!jwtSecret) {
      throw new Error('JWT_SECRET é obrigatório');
    }

    try {
      jwt.sign({}, jwtSecret, { expiresIn: jwtExpiresIn });
    } catch {
      throw new Error('JWT_EXPIRES_IN é inválido');
    }

    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async register(username, password) {
    const normalizedUsername = this.validateCredentials(username, password);

    if (this.userRepository.findByUsername(normalizedUsername)) {
      const error = new Error('Usuário já cadastrado');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await this.hashPassword(password);
    const user = {
      id: crypto.randomUUID(),
      username: normalizedUsername,
      passwordHash,
    };

    this.userRepository.save(user);
    return this.createSession(user);
  }

  async login(username, password) {
    const normalizedUsername = this.validateCredentials(username, password);
    const user = this.userRepository.findByUsername(normalizedUsername);

    if (!user || !(await this.verifyPassword(password, user.passwordHash))) {
      const error = new Error('Usuário ou senha inválidos');
      error.statusCode = 401;
      throw error;
    }

    return this.createSession(user);
  }

  verifyToken(token) {
    const payload = jwt.verify(token, this.jwtSecret);
    const user = this.userRepository.findById(payload.sub);

    if (!user) {
      throw new jwt.JsonWebTokenError('user not found');
    }

    return this.toPublicUser(user);
  }

  validateCredentials(username, password) {
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';

    if (!normalizedUsername || typeof password !== 'string' || password.length < 8) {
      const error = new Error('Usuário e senha de pelo menos 8 caracteres são obrigatórios');
      error.statusCode = 400;
      throw error;
    }

    return normalizedUsername;
  }

  async hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verifyPassword(password, passwordHash) {
    const [salt, storedKey] = passwordHash.split(':');
    const derivedKey = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(storedKey, 'hex'), derivedKey);
  }

  createSession(user) {
    const publicUser = this.toPublicUser(user);
    const token = jwt.sign(
      { username: publicUser.username },
      this.jwtSecret,
      { subject: publicUser.id, expiresIn: this.jwtExpiresIn },
    );

    return { token, user: publicUser };
  }

  toPublicUser(user) {
    return { id: user.id, username: user.username };
  }
}

module.exports = AuthService;