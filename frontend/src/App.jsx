import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UploadComponent from './components/UploadComponent';
import { clearSession, getStoredSession, storeSession } from './services/authService';

export default function App() {
  const [session, setSession] = useState(getStoredSession);
  const [authMode, setAuthMode] = useState('login');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    function handleUnauthorized() {
      clearSession();
      setSession(null);
    }

    window.addEventListener('dms:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('dms:unauthorized', handleUnauthorized);
  }, []);

  function handleAuthenticated(nextSession) {
    storeSession(nextSession);
    setSession(nextSession);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  if (!session) {
    return (
      <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '32rem', padding: '2rem' }}>
        <h1>Document Management System</h1>
        <div role="group" aria-label="Autenticação">
          <button type="button" onClick={() => setAuthMode('login')} disabled={authMode === 'login'}>
            Entrar
          </button>
          <button type="button" onClick={() => setAuthMode('register')} disabled={authMode === 'register'}>
            Criar conta
          </button>
        </div>
        {authMode === 'login'
          ? <LoginForm onAuthenticated={handleAuthenticated} />
          : <RegisterForm onAuthenticated={handleAuthenticated} />}
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '48rem', padding: '2rem' }}>
      <h1>Document Management System</h1>
      <p>Usuário: {session.user.username}</p>
      <button type="button" onClick={handleLogout}>Sair</button>
      <UploadComponent token={session.token} onUploaded={() => setRefreshToken((value) => value + 1)} />
      <h2>Documentos enviados</h2>
      <DocumentList token={session.token} refreshToken={refreshToken} />
    </main>
  );
}
