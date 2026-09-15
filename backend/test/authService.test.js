const { test } = require('node:test');
const assert = require('node:assert');

const UserRepository = require('../src/repositories/userRepository');
const AuthService = require('../src/services/authService');

function createAuthService(jwtExpiresIn = '1h') {
  return new AuthService({
    userRepository: new UserRepository(),
    jwtSecret: 'test-secret-with-at-least-32-characters',
    jwtExpiresIn,
  });
}

test('AuthService cadastra usuário e autentica suas credenciais', async () => {
  const service = createAuthService();
  const registeredSession = await service.register('user-1', 'password-123');
  const loginSession = await service.login('user-1', 'password-123');

  assert.strictEqual(registeredSession.user.username, 'user-1');
  assert.ok(registeredSession.token);
  assert.deepStrictEqual(loginSession.user, registeredSession.user);
  assert.deepStrictEqual(service.verifyToken(loginSession.token), registeredSession.user);
});

test('AuthService rejeita usuário duplicado e credenciais inválidas', async () => {
  const service = createAuthService();
  await service.register('user-1', 'password-123');

  await assert.rejects(() => service.register('user-1', 'password-456'), {
    message: 'Usuário já cadastrado',
    statusCode: 409,
  });
  await assert.rejects(() => service.login('user-1', 'password-456'), {
    message: 'Usuário ou senha inválidos',
    statusCode: 401,
  });
});

test('AuthService rejeita token expirado', async () => {
  const service = createAuthService('-1s');
  const session = await service.register('user-1', 'password-123');

  assert.throws(() => service.verifyToken(session.token), { name: 'TokenExpiredError' });
});

test('AuthService rejeita configuração JWT inválida', () => {
  assert.throws(() => new AuthService({
    userRepository: new UserRepository(),
    jwtSecret: '',
    jwtExpiresIn: '1h',
  }), { message: 'JWT_SECRET é obrigatório' });

  assert.throws(() => createAuthService('prazo-inválido'), {
    message: 'JWT_EXPIRES_IN é inválido',
  });
});