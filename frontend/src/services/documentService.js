const apiPrefix = '/api';

async function parseResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível concluir a operação');
  }

  return response;
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${apiPrefix}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: formData,
  });

  await parseResponse(response);
  return response.json();
}

export async function listDocuments(owner) {
  const response = await fetch(`${apiPrefix}/documents`, {
    headers: { 'X-User-Id': owner },
  });

  await parseResponse(response);
  return response.json();
}

export async function downloadDocument(id, owner) {
  const response = await fetch(`${apiPrefix}/documents/${id}/download`, {
    headers: { 'X-User-Id': owner },
  });

  await parseResponse(response);
  return response.blob();
}
