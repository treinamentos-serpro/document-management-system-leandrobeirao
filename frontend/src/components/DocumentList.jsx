import { useEffect, useState } from 'react';
import { listDocuments } from '../services/documentService';
import DownloadButton from './DownloadButton';

export default function DocumentList({ token, refreshToken }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError('');

    listDocuments(token)
      .then((nextDocuments) => {
        if (isCurrent) setDocuments(nextDocuments);
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, refreshToken]);

  if (isLoading) return <p>Carregando documentos...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!documents.length) return <p>Nenhum documento enviado.</p>;

  return (
    <ul>
      {documents.map((document) => (
        <li key={document.id}>
          <span>{document.originalName} ({document.size} bytes)</span>{' '}
          <DownloadButton document={document} token={token} />
        </li>
      ))}
    </ul>
  );
}
