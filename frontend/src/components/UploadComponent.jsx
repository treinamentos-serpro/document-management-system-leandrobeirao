import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentService';

export default function UploadComponent({ token, onUploaded }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const file = inputRef.current?.files[0];

    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setError('');
    setIsUploading(true);
    try {
      await uploadDocument(file, token);
      inputRef.current.value = '';
      onUploaded();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="document-file">Documento</label>
      <input id="document-file" ref={inputRef} type="file" />
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
