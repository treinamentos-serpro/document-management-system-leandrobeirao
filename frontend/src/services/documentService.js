const apiPrefix = '/api';

async function parseResponse(response) {
  if (response.status === 401) {
    sessionStorage.removeItem('dms-session');
    window.dispatchEvent(new Event('dms:unauthorized'));
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível concluir a operação');
  }

  return response;
}

function authorization(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function uploadDocument(file, token) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${apiPrefix}/upload`, {
    method: 'POST',
    headers: authorization(token),
    body: formData,
  });

  await parseResponse(response);
  return response.json();
}

export async function listDocuments(token) {
  const response = await fetch(`${apiPrefix}/documents`, {
    headers: authorization(token),
  });

  await parseResponse(response);
  return response.json();
}

export async function downloadDocument(id, token) {
  const response = await fetch(`${apiPrefix}/documents/${id}/download`, {
    headers: authorization(token),
  });

  await parseResponse(response);
  return response.blob();
}
