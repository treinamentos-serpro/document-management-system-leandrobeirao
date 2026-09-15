const apiPrefix = '/api';
const sessionKey = 'dms-session';

async function authenticate(endpoint, username, password) {
  const response = await fetch(`${apiPrefix}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || 'Não foi possível autenticar');
  }

  return body;
}

export function register(username, password) {
  return authenticate('/auth/register', username, password);
}

export function login(username, password) {
  return authenticate('/auth/login', username, password);
}

export function getStoredSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(sessionKey));

    if (!session?.token || !session.user?.id || !session.user?.username) {
      sessionStorage.removeItem(sessionKey);
      return null;
    }

    return session;
  } catch {
    sessionStorage.removeItem(sessionKey);
    return null;
  }
}

export function storeSession(session) {
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(sessionKey);
}