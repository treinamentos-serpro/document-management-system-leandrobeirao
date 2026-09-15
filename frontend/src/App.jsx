import { useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';

export default function App() {
  const [owner, setOwner] = useState('user-123');
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '48rem', padding: '2rem' }}>
      <h1>Document Management System</h1>
      <label htmlFor="owner">Usuário</label>
      <input id="owner" value={owner} onChange={(event) => setOwner(event.target.value)} />
      <UploadComponent owner={owner} onUploaded={() => setRefreshToken((value) => value + 1)} />
      <h2>Documentos enviados</h2>
      <DocumentList owner={owner} refreshToken={refreshToken} />
    </main>
  );
}
